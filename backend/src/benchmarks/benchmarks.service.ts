import { Injectable, Logger } from '@nestjs/common';

import { ethers } from 'ethers';

import { PrismaService } from '../prisma/prisma.service';

import { CreateBenchmarkDto } from './dto/create-benchmark.dto';

export interface TpsBenchmarkConfig {
  rpcUrl: string;
  duration: number;  // seconds
  txPerSecond: number;
  concurrency: number;
}

export interface TpsBenchmarkResult {
  startTime: number;
  endTime: number;
  duration: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  avgTps: number;
  peakTps: number;
  avgLatency: number;
  minLatency: number;
  maxLatency: number;
  blocksProduced: number;
}

@Injectable()
export class BenchmarksService {
  private readonly logger = new Logger(BenchmarksService.name);

  constructor(private readonly prisma: PrismaService) { }

  private async isRpcReachable(rpcUrl: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return res.ok;
    } catch {
      return false;
    }
  }

  async list() {
    return this.prisma.benchmark.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateBenchmarkDto) {
    // Note: DTO properties may not perfectly match the Benchmark schema right now, 
    // adjusting to match the model we saw in schema.prisma.
    return this.prisma.benchmark.create({
      data: {
        networkId: dto.validatorId || 'default', // Fallback as networkId is required
        duration: 60,
        targetTps: 100,
        concurrency: 10,
      },
    });
  }

  // Real-time TPS benchmark using actual transactions
  async runTpsTest(config: TpsBenchmarkConfig): Promise<TpsBenchmarkResult> {
    const { rpcUrl, duration, txPerSecond, concurrency } = config;

    this.logger.log(`Starting TPS benchmark: ${txPerSecond} TPS target, ${duration}s duration, ${concurrency} concurrent`);

    if (!await this.isRpcReachable(rpcUrl)) {
      throw new Error('Avalanche node is offline. Cannot run TPS benchmark.');
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Use EWOQ test key
    const PRIVATE_KEY = process.env.PRIVATE_KEY || '56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027';
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    const startBlock = await provider.getBlockNumber();
    const startTime = Date.now();
    const endTime = startTime + (duration * 1000);

    const results: { success: boolean; latency: number }[] = [];
    const tpsSnapshots: number[] = [];

    let txCount = 0;
    let successCount = 0;
    let failCount = 0;

    // Get initial nonce
    let nonce = await wallet.getNonce();
    const gasPrice = await provider.getFeeData();

    // Simple transfer to self for benchmarking
    const to = wallet.address;
    const value = ethers.parseEther('0.0001');

    this.logger.log(`Starting from nonce ${nonce}, wallet ${wallet.address}`);

    const interval = 1000 / txPerSecond;
    let lastSecondTxCount = 0;
    let lastSecondStart = Date.now();

    // Run benchmark loop
    while (Date.now() < endTime) {
      const batch: Promise<void>[] = [];

      for (let i = 0; i < Math.min(concurrency, txPerSecond); i++) {
        const txStart = Date.now();
        const currentNonce = nonce++;

        const txPromise = (async () => {
          try {
            const tx = await wallet.sendTransaction({
              to,
              value,
              nonce: currentNonce,
              gasLimit: 21000,
              maxFeePerGas: gasPrice.maxFeePerGas,
              maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas,
            });

            // Wait for confirmation
            const receipt = await tx.wait();
            const latency = Date.now() - txStart;

            results.push({ success: true, latency });
            successCount++;
            txCount++;
          } catch (error) {
            results.push({ success: false, latency: Date.now() - txStart });
            failCount++;
            txCount++;
            this.logger.warn(`Transaction failed: ${(error as Error).message}`);
          }
        })();

        batch.push(txPromise);
      }

      await Promise.all(batch);

      // Calculate TPS for this second
      const now = Date.now();
      if (now - lastSecondStart >= 1000) {
        const tpsThisSecond = txCount - lastSecondTxCount;
        tpsSnapshots.push(tpsThisSecond);
        lastSecondTxCount = txCount;
        lastSecondStart = now;

        this.logger.log(`TPS: ${tpsThisSecond}, Total: ${txCount}/${successCount} success`);
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    const actualEndTime = Date.now();
    const endBlock = await provider.getBlockNumber();

    // Calculate metrics
    const successfulLatencies = results.filter(r => r.success).map(r => r.latency);
    const avgLatency = successfulLatencies.length > 0
      ? successfulLatencies.reduce((a, b) => a + b, 0) / successfulLatencies.length
      : 0;

    const benchmarkResult: TpsBenchmarkResult = {
      startTime,
      endTime: actualEndTime,
      duration: (actualEndTime - startTime) / 1000,
      totalTransactions: txCount,
      successfulTransactions: successCount,
      failedTransactions: failCount,
      avgTps: successCount / ((actualEndTime - startTime) / 1000),
      peakTps: Math.max(...tpsSnapshots, 0),
      avgLatency: Math.round(avgLatency),
      minLatency: successfulLatencies.length > 0 ? Math.min(...successfulLatencies) : 0,
      maxLatency: successfulLatencies.length > 0 ? Math.max(...successfulLatencies) : 0,
      blocksProduced: endBlock - startBlock,
    };

    this.logger.log(`Benchmark complete: ${successCount} TX, ${benchmarkResult.avgTps.toFixed(2)} avg TPS`);

    return benchmarkResult;
  }

  // Quick read-only benchmark (no actual transactions)
  async runReadBenchmark(rpcUrl: string, iterations: number = 100): Promise<{
    avgLatency: number;
    minLatency: number;
    maxLatency: number;
    successRate: number;
  }> {
    if (!await this.isRpcReachable(rpcUrl)) {
      throw new Error('Avalanche node is offline. Cannot run read benchmark.');
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const latencies: number[] = [];
    let successCount = 0;

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      try {
        await provider.getBlockNumber();
        latencies.push(Date.now() - start);
        successCount++;
      } catch (error) {
        latencies.push(Date.now() - start);
      }
    }

    return {
      avgLatency: Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length),
      minLatency: Math.min(...latencies),
      maxLatency: Math.max(...latencies),
      successRate: (successCount / iterations) * 100,
    };
  }
}

