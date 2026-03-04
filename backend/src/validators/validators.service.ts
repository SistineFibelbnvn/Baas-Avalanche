import { Injectable, Logger, HttpException, HttpStatus, OnModuleInit } from '@nestjs/common';
import { PChainService } from '../pchain/pchain.service';
import { PrismaService } from '../prisma/prisma.service';
import * as util from 'util';
import { exec, spawn } from 'child_process';
const execPromise = util.promisify(exec);

@Injectable()
export class ValidatorsService implements OnModuleInit {
  private readonly logger = new Logger(ValidatorsService.name);
  private portCache = new Map<string, number>();

  constructor(
    private readonly pchainService: PChainService,
    private readonly prisma: PrismaService
  ) { }

  async onModuleInit() {
    this.recoverDockerPorts();
  }

  async recoverDockerPorts() {
    try {
      // Check if Docker is available first
      try {
        await execPromise('docker info', { timeout: 3000 });
      } catch {
        this.logger.debug('Docker is not running. Skipping port recovery.');
        return;
      }

      const validators = await this.prisma.validator.findMany({
        where: { containerId: { not: null } }
      });

      if (validators.length === 0) {
        this.logger.debug('No docker validators to recover ports for.');
        return;
      }

      this.logger.log(`Recovering ports for ${validators.length} docker validators...`);

      for (const v of validators) {
        if (v.containerId) {
          try {
            // Run docker port (Wait for 5s explicitly if needed? No, assumes running)
            const { stdout } = await execPromise(`docker port ${v.containerId} 9650`);
            // Output example: 0.0.0.0:12345
            if (stdout) {
              const match = stdout.match(/:(\d+)/);
              if (match && match[1]) {
                this.portCache.set(v.nodeId, parseInt(match[1]));
              }
            }
          } catch (e: any) {
            const msg = e.message || String(e);
            if (msg.includes('no public port') || msg.includes('ECONNREFUSED') || msg.includes('No such container')) {
              this.logger.debug(`Could not get port for ${v.containerId} (Container likely offline or removed)`);
              // Clean stale containerId from DB so we don't keep trying
              if (msg.includes('No such container')) {
                await this.prisma.validator.update({
                  where: { id: v.id },
                  data: { containerId: null }
                }).catch(() => { });
              }
            } else {
              this.logger.warn(`Could not get port for ${v.containerId}: ${msg}`);
            }
          }
        }
      }
      this.logger.log(`Recovered ${this.portCache.size} ports.`);
    } catch (e) {
      this.logger.error('Failed to recover docker ports', e);
    }
  }

  getPrometheusTargets() {
    const targets: any[] = [];
    this.portCache.forEach((port, nodeId) => {
      // Route through backend metrics proxy instead of direct node port
      // This avoids http-allowed-hosts restrictions on the Avalanche node
      targets.push({
        targets: ['host.docker.internal:4000'],
        labels: {
          __metrics_path__: `/monitoring/metrics/${port}`,
          job: 'avalanche_node',
          instance: `docker-${nodeId.slice(0, 12)}`,
        }
      });
    });
    return targets;
  }

  async fetchNodeId() {
    try {
      // Query local node
      const response = await fetch('http://127.0.0.1:9650/ext/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'info.getNodeID'
        })
      });

      if (!response.ok) {
        throw new Error(`Node connection failed: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message);
      }

      return {
        nodeId: data.result.nodeID,
        blsPublicKey: data.result.nodePOP?.publicKey || '0xUnavailable',
        blsProof: data.result.nodePOP?.proofOfPossession || '0xUnavailable'
      };

    } catch (error: any) {
      this.logger.error('Failed to fetch node ID', error);
      // Fallback
      return {
        nodeId: 'NodeID-LocalBootstrapper',
        blsPublicKey: '0xMockPublicKeyForSimulation',
        blsProof: '0xMockProofForSimulation'
      };
    }
  }

  async findAll(subnetId?: string) {
    try {
      // 1. Fetch from P-Chain (Real Network State)
      // Note: getValidators may return empty if local node isn't tracking the subnet yet
      const pchainValidators = await this.pchainService.getValidators(subnetId);

      const mappedPChain = pchainValidators.map((v: any) => ({
        nodeId: v.nodeID,
        stake: (parseInt(v.weight) / 1000000000).toFixed(0), // Convert nAVAX to AVAX
        startTime: v.startTime,
        endTime: v.endTime,
        uptime: Math.min(parseFloat(v.uptime || '0') * 100, 100), // Convert fraction to %, cap at 100
        connected: v.connected,
        status: v.connected ? 'active' : 'inactive'
      }));

      // 2. Fetch from Database (Persisted Local Nodes/Manual Adds)
      const where: any = {};
      if (subnetId) {
        where.OR = [
          { networkId: subnetId }, // Linked by DB ID
          { network: { subnetId: subnetId } } // Linked by Avalanche ID
        ];
      }

      // Safe query with try-catch in case Prisma not ready
      let dbValidators: any[] = [];
      try {
        dbValidators = await this.prisma.validator.findMany({
          where: Object.keys(where).length > 0 ? where : undefined,
          include: { network: true }
        });
      } catch (e) {
        this.logger.warn(`Failed to fetch validators from DB: ${e}`);
      }

      const mappedDB = dbValidators.map(v => ({
        nodeId: v.nodeId,
        stake: v.stakeAmount || String(v.weight) || '0',
        startTime: v.startTime?.toISOString(),
        endTime: v.endTime?.toISOString(),
        uptime: Math.min((v.uptime ?? 1.0) * 100, 100), // Convert 1.0 -> 100%, cap at 100
        connected: v.connected ?? true,
        status: 'active', // Assumed active for local/static nodes
        isLocal: true
      }));

      // 3. Fallback: If absolutely no validators found (P-Chain empty & DB empty),
      // it means we are likely in a Local Dev environment where P-Chain API isn't returning data yet,
      // or it's a new Subnet validated by the Local Bootstrapper.
      // So we default to showing the Local Node ID as the validator.
      if (mappedPChain.length === 0 && mappedDB.length === 0) {
        let fallbackNodeId = 'NodeID-LocalBootstrapper';
        try {
          const info = await this.fetchNodeId();
          if (info.nodeId) fallbackNodeId = info.nodeId;
        } catch (e) { }

        return [{
          nodeId: fallbackNodeId,
          stakeAmount: '2000000000',
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 31536000000).toISOString(),
          uptime: 100,
          connected: true,
          status: 'active',
          isLocal: true // Mark as auto-detected local
        }];
      }

      // Merge (Deduplicate by NodeID if needed? For now just concat)
      // Filter out mappedDB if it's already in mappedPChain?
      const pChainIds = new Set(mappedPChain.map((v: any) => v.nodeId));
      const uniqueDB = mappedDB.filter(v => !pChainIds.has(v.nodeId));

      return [...mappedPChain, ...uniqueDB];

    } catch (error) {
      this.logger.error(`Failed to list validators`, error);
      return [];
    }
  }

  async addValidator(dto: any) {
    this.logger.log(`Request to add validator: ${JSON.stringify(dto)}`);

    // Find Network
    let network = null;
    try {
      if (dto.subnetId) {
        network = await this.prisma.network.findFirst({
          where: { OR: [{ id: dto.subnetId }, { subnetId: dto.subnetId }] }
        });
      }

      if (!network) {
        throw new HttpException('Active Network not found. Please select a network.', HttpStatus.BAD_REQUEST);
      }

      let nodeId = dto.nodeId;
      let containerId = null;
      let extraData: any = {};

      // Docker Auto-Start Logic
      if (dto.runInDocker) {
        this.logger.log('Starting new Validator Node in Docker...');
        const nodeInfo = await this.createNodeContainer();
        nodeId = nodeInfo.nodeId;
        containerId = nodeInfo.containerId;
        extraData.httpPort = nodeInfo.httpPort;
        this.portCache.set(nodeId, nodeInfo.httpPort); // Cache it
        this.logger.log(`Docker Node Started: ${nodeId} (${containerId})`);
      }

      const validator = await this.prisma.validator.create({
        data: {
          nodeId: nodeId,
          networkId: network.id,
          weight: Number(dto.stake || 1),
          stakeAmount: String(dto.stake || '2000'),
          connected: true,
          startTime: new Date(),
          endTime: new Date(Date.now() + 31536000000), // 1 year
          containerId: containerId
        }
      });

      return {
        status: 'COMPLETED',
        message: 'Validator added to database',
        nodeId: validator.nodeId
      };
    } catch (e: any) {
      this.logger.error('Failed to add validator', e);
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  // Create a new Docker container for Avalanche Node
  private async createNodeContainer(networkId = 'local') {
    const containerId = `avax-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const httpPort = Math.floor(Math.random() * (20000 - 10000) + 10000);
    const stakingPort = Math.floor(Math.random() * (20000 - 10000) + 10000);

    // Use spawn to avoid shell expansion issues with wildcards (*)
    const args = [
      'run', '-d',
      '--name', containerId,
      '-p', `${httpPort}:9650`,
      '-p', `${stakingPort}:9651`,
      'avaplatform/avalanchego:latest',
      '/avalanchego/build/avalanchego',
      `--network-id=${networkId}`,
      '--http-host=0.0.0.0',
      '--public-ip=127.0.0.1',
      '--http-allowed-hosts=host.docker.internal,localhost,127.0.0.1'
    ];

    await new Promise((resolve, reject) => {
      const child = spawn('docker', args, { stdio: 'inherit' });
      child.on('close', (code) => {
        if (code === 0) resolve(true);
        else reject(new Error(`Docker exited with code ${code}`));
      });
      child.on('error', reject);
    });

    // Wait for node to spin up and get ID
    let attempts = 0;
    while (attempts < 20) {
      await new Promise(r => setTimeout(r, 2000)); // Wait 2s
      try {
        const response = await fetch(`http://127.0.0.1:${httpPort}/ext/info`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'info.getNodeID' })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.result && data.result.nodeID) {
            return {
              nodeId: data.result.nodeID,
              containerId: containerId,
              httpPort
            };
          }
        }
      } catch (e) {
        // Ignore connection errors while starting
      }
      attempts++;
    }
    throw new Error('Timeout waiting for Docker Node to start');
  }

  async remove(id: string) {
    // Implement delete from DB
    try {
      // Find validator first to check for container
      const validator = await this.prisma.validator.findFirst({ where: { nodeId: id } });

      if (validator && validator.containerId) {
        this.logger.log(` stopping container ${validator.containerId}`);
        try {
          await execPromise(`docker stop ${validator.containerId} && docker rm ${validator.containerId}`);
        } catch (e) {
          this.logger.warn(`Failed to stop docker container: ${e}`);
        }
      }

      await this.prisma.validator.deleteMany({ where: { nodeId: id } });
      return { status: 'COMPLETED', message: 'Validator removed' };
    } catch (e: any) {
      throw new HttpException('Failed to remove validator: ' + e.message, HttpStatus.BAD_REQUEST);
    }
  }
}
