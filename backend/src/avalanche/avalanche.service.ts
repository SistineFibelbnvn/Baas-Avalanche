import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JsonRpcProvider } from 'ethers';

export interface NetworkSnapshot {
  chainId: number;
  blockNumber: number;
  gasPrice: string;
  peerCount?: number;
  clientVersion?: string;
  timestamp: string;
}

@Injectable()
export class AvalancheService {
  private readonly logger = new Logger(AvalancheService.name);
  private readonly rpcUrl: string;
  private provider: JsonRpcProvider | null = null;

  constructor(private readonly configService: ConfigService) {
    this.rpcUrl = configService.getOrThrow<string>('RPC_URL');
    // Don't create provider here — it will retry infinitely if node is offline
  }

  private async isRpcReachable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(this.rpcUrl, {
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

  private async getProvider(): Promise<JsonRpcProvider | null> {
    if (!await this.isRpcReachable()) {
      this.provider = null;
      return null;
    }
    if (!this.provider) {
      this.provider = new JsonRpcProvider(this.rpcUrl);
    }
    return this.provider;
  }

  async getNetworkSnapshot(): Promise<NetworkSnapshot | null> {
    const provider = await this.getProvider();
    if (!provider) return null;

    try {
      const [network, blockNumber, feeData, clientVersion, peerHex] = await Promise.all([
        provider.getNetwork(),
        provider.getBlockNumber(),
        provider.getFeeData(),
        provider.send('web3_clientVersion', []),
        provider.send('net_peerCount', []),
      ]);

      return {
        chainId: Number(network.chainId),
        blockNumber,
        gasPrice: feeData.gasPrice?.toString() ?? '0',
        clientVersion,
        peerCount: parseInt(peerHex, 16),
        timestamp: new Date().toISOString(),
      };
    } catch {
      this.provider = null;
      return null;
    }
  }

  async ping(): Promise<boolean> {
    const provider = await this.getProvider();
    if (!provider) return false;
    try {
      await provider.getBlockNumber();
      return true;
    } catch {
      this.provider = null;
      return false;
    }
  }
}

