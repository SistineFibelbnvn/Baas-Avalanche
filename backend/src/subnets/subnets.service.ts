import { Injectable, Logger, NotFoundException, ForbiddenException, OnModuleInit } from '@nestjs/common';
import { CreateSubnetDto } from './dto/create-subnet.dto';
import { Mutex } from 'async-mutex';
import { PrismaService } from '../prisma/prisma.service';

// In-memory storage (temporary - replace with Prisma later)
export interface Subnet {
  id: string;
  name: string;
  vmType: string;
  network: string;
  status: string;
  config: any;
  chainId?: string;
  rpcUrl?: string;
  wsUrl?: string;
  tokenSymbol?: string;
  subnetId?: string;
  blockchainId?: string;
  cliVersion?: string;
  ownerAddress?: string; // Wallet address of the owner
  createdAt: Date;
  validators: any[];
  operations: SubnetOperation[];
}

export interface SubnetOperation {
  id: string;
  subnetId: string;
  type: string;
  status: string;
  log: string;
  createdAt: Date;
  completedAt?: Date;
}

const subnets: Map<string, Subnet> = new Map();
const operations: Map<string, SubnetOperation> = new Map();
// Global mutex to prevent concurrent CLI usage
const cliMutex = new Mutex();

@Injectable()
export class SubnetsService implements OnModuleInit {
  private readonly logger = new Logger(SubnetsService.name);

  constructor(private prisma: PrismaService) { }

  async onModuleInit() {
    try {
      const networks = await this.prisma.network.findMany({
        include: { operations: true, contracts: true }
      });

      networks.forEach(n => {
        const subnet = this.mapToSubnet(n);
        subnets.set(subnet.id, subnet);

        n.operations.forEach(op => {
          const operation: SubnetOperation = {
            id: op.id,
            subnetId: op.networkId, // Relation field is networkId
            type: op.type,
            status: op.status,
            log: op.log || '',
            createdAt: op.createdAt,
            completedAt: op.completedAt || undefined
          };
          operations.set(operation.id, operation);
        });
      });
      this.logger.log(`Loaded ${networks.length} subnets from database`);

      // Auto-start: if any subnets were previously RUNNING, try to restart the local network
      const runnableSubnets = networks.filter(n => n.status === 'RUNNING' || n.status === 'STOPPED');
      if (runnableSubnets.length > 0) {
        this.logger.log(`Found ${runnableSubnets.length} subnet(s) to auto-start. Scheduling network start...`);
        // Delay to allow other services to initialize
        setTimeout(() => this.autoStartNetwork(runnableSubnets.map(n => n.id)), 5000);
      }
    } catch (e) {
      this.logger.error("Failed to load subnets from DB", e);
    }
  }

  private async autoStartNetwork(subnetIds: string[]) {
    const path = require('path');
    const fs = require('fs');
    const isWindows = process.platform === 'win32';
    const binaryName = isWindows ? 'avalanche.exe' : 'avalanche';
    const localCliPath = path.join(process.cwd(), 'bin', binaryName);

    const cliPath = process.env.AVALANCHE_CLI_PATH || (
      fs.existsSync(localCliPath) ? localCliPath : null
    );

    if (!cliPath) {
      this.logger.warn('Cannot auto-start subnets: AVALANCHE_CLI_PATH not set');
      return;
    }

    const release = await cliMutex.acquire();
    this.logger.log('Auto-start: acquired CLI lock');

    try {
      const operationId = `auto-start-${Date.now()}`;
      const operation: SubnetOperation = {
        id: operationId,
        subnetId: 'system',
        type: 'AUTO_START',
        status: 'RUNNING',
        log: '',
        createdAt: new Date(),
      };
      operations.set(operationId, operation);

      // Step 1: Start the network
      this.logger.log('Auto-start [1/4]: Starting network...');
      try {
        await this.runCommandWithOutput(cliPath, ['network', 'start', '--skip-update-check'], operationId, process.cwd());
      } catch (e) {
        this.logger.log('Auto-start: first start attempt done (may already be running)');
      }

      // Step 2: Inject http-host=0.0.0.0 config so Windows can reach WSL node
      this.logger.log('Auto-start [2/4]: Configuring node for external access...');
      await this.configureLocalNode(cliPath, process.cwd());

      // Step 3: Restart network so config takes effect
      this.logger.log('Auto-start [3/4]: Restarting network with new config...');
      try {
        await this.runCommandWithOutput(cliPath, ['network', 'stop', '--skip-update-check'], operationId, process.cwd());
      } catch (e) {
        this.logger.log('Auto-start: stop before restart done');
      }

      // Small delay to let processes fully stop
      await new Promise(r => setTimeout(r, 2000));

      await this.runCommandWithOutput(cliPath, ['network', 'start', '--skip-update-check'], operationId, process.cwd());

      // Step 4: Wait for node to be healthy
      this.logger.log('Auto-start [4/4]: Waiting for node to become healthy...');
      await this.waitForNodeHealth(8, 3000);

      // Mark subnets as RUNNING
      for (const id of subnetIds) {
        const subnet = subnets.get(id);
        if (subnet) {
          subnet.status = 'RUNNING';
        }
      }

      operation.status = 'COMPLETED';
      operation.completedAt = new Date();
      this.logger.log('Auto-start: network started successfully ✅');
    } catch (error) {
      this.logger.warn(`Auto-start: network start failed (node may not be available): ${error}`);
      // Don't mark subnets as FAILED - they might work once user starts the node manually
    } finally {
      release();
      this.logger.log('Auto-start: released CLI lock');
    }
  }

  private async waitForNodeHealth(maxRetries: number, delayMs: number): Promise<void> {
    const http = require('http');
    for (let i = 0; i < maxRetries; i++) {
      try {
        const healthy = await new Promise<boolean>((resolve) => {
          const req = http.get('http://127.0.0.1:9650/ext/health', (res: any) => {
            let data = '';
            res.on('data', (chunk: string) => data += chunk);
            res.on('end', () => {
              try {
                const json = JSON.parse(data);
                resolve(json.healthy === true);
              } catch {
                resolve(false);
              }
            });
          });
          req.on('error', () => resolve(false));
          req.setTimeout(3000, () => { req.destroy(); resolve(false); });
        });

        if (healthy) {
          this.logger.log(`Node healthy after ${i + 1} check(s)`);
          return;
        }
      } catch { }

      this.logger.log(`Health check ${i + 1}/${maxRetries} failed, retrying in ${delayMs}ms...`);
      await new Promise(r => setTimeout(r, delayMs));
    }
    this.logger.warn(`Node did not become healthy after ${maxRetries} retries, proceeding anyway`);
  }

  private mapToSubnet(n: any): Subnet {
    return {
      id: n.id,
      name: n.name,
      vmType: n.vmType,
      network: n.network,
      status: n.status,
      ownerAddress: n.ownerAddress || undefined,
      subnetId: n.subnetId || undefined,
      blockchainId: n.blockchainId || undefined,
      chainId: n.chainId.toString(),
      rpcUrl: n.rpcUrl || undefined,
      wsUrl: n.wsUrl || undefined,
      tokenSymbol: n.tokenSymbol || 'TOKEN',
      cliVersion: n.cliVersion || undefined,
      createdAt: n.createdAt,
      validators: [],
      operations: [],
      config: {
        tokenSymbol: n.tokenSymbol,
        tokenSupply: n.tokenSupply,
        gasLimit: n.gasLimit,
        minBaseFee: n.minBaseFee,
        targetBlockRate: n.targetBlockRate,
        validatorType: n.validatorType,
        validatorManagerOwner: n.validatorManagerOwner,
        vmVersion: n.vmVersion,
        enableICM: n.enableICM,
        configMode: n.configMode,
        vmBinaryPath: undefined, // Not stored in DB explicitly yet or mapped?
        genesisPath: undefined
      }
    };
  }

  private async persistSubnet(subnet: Subnet) {
    try {
      const config = subnet.config || {};
      // Map Subnet back to Prisma Input
      // Note: using 'any' to bypass partial type mismatch during rapid dev
      await this.prisma.network.upsert({
        where: { id: subnet.id },
        create: {
          id: subnet.id,
          name: subnet.name,
          vmType: subnet.vmType,
          network: subnet.network,
          status: subnet.status,
          ownerAddress: subnet.ownerAddress,
          subnetId: subnet.subnetId,
          blockchainId: subnet.blockchainId,
          rpcUrl: subnet.rpcUrl,
          wsUrl: subnet.wsUrl,
          chainId: config.chainId, // Should always be set from create()
          // Config fields
          tokenSymbol: config.tokenSymbol,
          tokenSupply: config.tokenSupply,
          gasLimit: Number(config.gasLimit || 0),
          minBaseFee: config.minBaseFee,
          vmVersion: config.vmVersion,
        } as any,
        update: {
          status: subnet.status,
          subnetId: subnet.subnetId,
          blockchainId: subnet.blockchainId,
          rpcUrl: subnet.rpcUrl,
          wsUrl: subnet.wsUrl,
          // Add other fields that might change
          cliOutput: JSON.stringify(config) // Store raw config as backup?
        }
      });
    } catch (e) {
      this.logger.error(`Failed to persist subnet ${subnet.id}`, e);
    }
  }


  async create(dto: CreateSubnetDto) {
    const id = `subnet${Date.now()}`;

    // Generate a unique chain ID if not provided (range: 10000-99999 to avoid conflicts)
    const generatedChainId = dto.chainId || (10000 + Math.floor(Math.random() * 89999));

    // Merge DTO fields into config object for easier access
    const config = {
      ...(dto.config || {}),
      chainId: generatedChainId, // Use generated/provided ID
      tokenSymbol: dto.tokenSymbol,
      tokenName: dto.tokenName,
      tokenSupply: dto.tokenSupply,
      gasLimit: dto.gasLimit,
      minBaseFee: dto.minBaseFee,
      targetBlockRate: dto.targetBlockRate,
      validatorManagerOwner: dto.validatorManagerOwner,
      vmVersion: dto.vmVersion,
      enableICM: dto.enableICM,
      vmBinaryPath: dto.vmBinaryPath,
      genesisPath: dto.genesisPath,
      configMode: dto.configMode,
      validatorType: dto.validatorType,
      // Advanced genesis data from frontend wizard
      genesisData: dto.genesisData,  // Full genesis JSON generated by frontend
      nativeMinter: dto.nativeMinter,
      contractDeployerAllowlist: dto.contractDeployerAllowlist,
      transactionAllowlist: dto.transactionAllowlist,
      feeManagerAllowlist: dto.feeManagerAllowlist,
    };

    const subnet: Subnet = {
      id,
      name: dto.name,
      vmType: dto.vmType,
      network: dto.network ?? 'LOCAL',
      status: 'DRAFT',
      config,
      tokenSymbol: dto.tokenSymbol || 'TOKEN',
      ownerAddress: dto.ownerAddress,
      createdAt: new Date(),
      validators: [],
      operations: [],
    };

    subnets.set(id, subnet);

    // Don't await provision, but provision will now queue up on the mutex
    this.provisionSubnet(id).catch((error) => {
      this.logger.error(`Provision subnet ${id} failed`, error as Error);
    });

    await this.persistSubnet(subnet);
    return subnet;
  }

  findAll(ownerAddress?: string) {
    let results = Array.from(subnets.values()).map(subnet => ({
      ...subnet,
      operations: Array.from(operations.values())
        .filter(op => op.subnetId === subnet.id)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 1),
    }));

    if (ownerAddress) {
      results = results.filter(s =>
        !s.ownerAddress || // Include public/system networks
        s.ownerAddress.toLowerCase() === ownerAddress.toLowerCase()
      );
    }

    return results;
  }

  async findOne(id: string) {
    const subnet = subnets.get(id);
    if (!subnet) {
      throw new NotFoundException(`Subnet ${id} không tồn tại`);
    }
    return subnet;
  }

  async getOperations(id: string) {
    const subnet = subnets.get(id);
    if (!subnet) {
      throw new NotFoundException(`Subnet ${id} không tồn tại`);
    }
    return Array.from(operations.values())
      .filter(op => op.subnetId === id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  private async provisionSubnet(subnetId: string): Promise<void> {
    const release = await cliMutex.acquire();
    this.logger.log(`Acquired lock for subnet ${subnetId}. Operation start.`);

    try {
      await this._provisionSubnetInternal(subnetId);
    } finally {
      release();
      this.logger.log(`Released lock for subnet ${subnetId}. Operation end.`);
    }
  }

  private async _provisionSubnetInternal(subnetId: string): Promise<void> {
    const path = require('path');
    const fs = require('fs');
    const workdir = process.cwd();

    const isWindows = process.platform === 'win32';
    const binaryName = isWindows ? 'avalanche.exe' : 'avalanche';
    const localCliPath = path.join(workdir, 'bin', binaryName);

    const cliPath = process.env.AVALANCHE_CLI_PATH || (
      fs.existsSync(localCliPath) ? localCliPath : null
    );

    if (!cliPath) {
      throw new Error(`Thiếu biến môi trường AVALANCHE_CLI_PATH và không tìm thấy tại: ${localCliPath}`);
    }

    const operationId = `op${Date.now()}`;
    const operation: SubnetOperation = {
      id: operationId,
      subnetId,
      type: 'CREATE',
      status: 'RUNNING',
      log: '',
      createdAt: new Date(),
    };
    operations.set(operationId, operation);

    try {
      const subnet = subnets.get(subnetId);
      if (subnet) {
        subnet.status = 'CREATING';
      }

      const config = subnet?.config || {};

      await this.runCommand(cliPath, ['--skip-update-check', '--version'], operationId, workdir);

      const createFlags = ['blockchain', 'create', subnetId];

      // VM Type Handling
      const vmType = (subnet?.vmType || 'subnet-evm').toLowerCase();
      const hasCustomVmBinary = !!config.vmBinaryPath;

      if (hasCustomVmBinary) {
        createFlags.push('--custom');
        createFlags.push('--custom-vm-path', config.vmBinaryPath);
        if (config.genesisPath) {
          createFlags.push('--genesis', config.genesisPath);
        }
      } else {
        createFlags.push('--evm');
      }

      // Always let CLI create genesis with test-defaults (includes PoA contracts)
      if (!hasCustomVmBinary) {
        createFlags.push('--test-defaults');
      }

      // Validator Handling
      const validatorType = config.validatorType || 'poa';
      if (validatorType === 'poa') {
        createFlags.push('--proof-of-authority');
      } else if (validatorType === 'pos') {
        createFlags.push('--proof-of-stake');
      }

      const validatorManagerOwner = config.validatorManagerOwner || '0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC';
      createFlags.push('--validator-manager-owner', validatorManagerOwner);

      // chainId is used later for subnet.chainId assignment
      const chainId = config.chainId;
      if (!chainId) this.logger.warn('No chainId in config, this should not happen');
      createFlags.push('--evm-chain-id', chainId.toString());

      const tokenSymbol = config.tokenSymbol || 'AVXU';
      createFlags.push('--evm-token', tokenSymbol);

      // VM Version Handling
      const vmVersion = config.vmVersion || 'latest';
      if (vmVersion === 'latest') {
        createFlags.push('--latest');
      } else if (vmVersion === 'pre-release') {
        createFlags.push('--pre-release');
      } else if (vmVersion !== 'custom') {
        createFlags.push('--vm-version', vmVersion);
      }

      const enableICM = config.enableICM !== false;
      if (enableICM) {
        createFlags.push('--icm');
      }

      // Add network flag to avoid interactive prompt
      if (subnet?.network === 'FUJI') {
        createFlags.push('--fuji');
      } else if (subnet?.network === 'MAINNET') {
        createFlags.push('--mainnet');
      } else {
        createFlags.push('--local');
      }

      createFlags.push('--force');
      createFlags.push('--skip-update-check');

      await this.runCommand(cliPath, createFlags, operationId, workdir);

      // HYBRID: After CLI creates genesis (with proper PoA contracts),
      // patch it with user's custom allocations, feeConfig, allowlists
      const hasGenesisData = !!config.genesisData;
      const hasCustomAllocations = config.genesisData?.alloc && Object.keys(config.genesisData.alloc as any).length > 0;
      const hasCustomFee = !!config.gasLimit || !!config.minBaseFee;
      const hasAllowlists = !!config.contractDeployerAllowlist?.enabled || !!config.transactionAllowlist?.enabled || !!config.feeManagerAllowlist?.enabled;

      if (hasGenesisData || hasCustomAllocations || hasCustomFee || hasAllowlists) {
        this.logger.log('Patching CLI-generated genesis with user custom data...');
        await this.patchGenesisFile(subnetId, config, cliPath, workdir, operationId);
      }

      if (subnet) {
        subnet.status = 'DEPLOYING';
      }

      // Build deploy flags for non-interactive deployment
      const deployFlags = ['blockchain', 'deploy', subnetId];

      // Add network-specific flags
      if (subnet?.network === 'FUJI') {
        deployFlags.push('--fuji');
      } else if (subnet?.network === 'MAINNET') {
        deployFlags.push('--mainnet');
      } else {
        deployFlags.push('--local');
        // Use ewoq (test) key for local deployment - avoids key selection prompt
        deployFlags.push('--ewoq');
      }

      // Skip relayer for faster local deployment (can be enabled later if needed)
      deployFlags.push('--skip-relayer');
      deployFlags.push('--skip-update-check');

      // Run deploy and capture output to parse blockchain ID
      if (deployFlags.includes('--local')) {
        await this.configureLocalNode(cliPath, workdir);
      }

      const deployOutput = await this.runCommandWithOutput(
        cliPath,
        deployFlags,
        operationId,
        workdir,
      );

      // Parse blockchain ID, Node ID, and RPC from CLI output
      // The CLI outputs results in table formats.
      let blockchainId = subnetId;
      let extractedRpcUrl = '';
      let extractedNodeId = '';

      // Strip ANSI escape codes
      const cleanOutput = deployOutput.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
      this.logger.log(`Cleaned Deploy Output:\n${cleanOutput}`);

      // 1. Extract RPC URL
      const rpcPatterns = [
        /RPC Endpoint[:\s|]+(http[^\s|]+)/i,
        /Network RPC URL[|\s]+(http[^\s|]+)/i,
        /RPC URL[:\s|]+(http[^\s|]+)/i,
        /URI:\s*(http:\/\/[^\s]+)/i // URI often matches node URI, we might append chain ID later if needed
      ];

      for (const pattern of rpcPatterns) {
        const match = cleanOutput.match(pattern);
        if (match) {
          let rawUrl = match[1].trim();
          rawUrl = rawUrl.replace(/[|\s]+$/, '').replace('localhost', '127.0.0.1');

          // If URI matched (e.g. 9654), it might be node URI, not full RPC. 
          // But usually "RPC Endpoint" includes /ext/bc/...
          extractedRpcUrl = rawUrl;
          break;
        }
      }

      // 2. Extract Blockchain ID
      // Try from RPC URL first
      if (extractedRpcUrl && extractedRpcUrl.includes('/ext/bc/')) {
        const bcMatch = extractedRpcUrl.match(/\/ext\/bc\/([^\/]+)\//);
        if (bcMatch) blockchainId = bcMatch[1];
      } else {
        // Fallback to table parsing
        const bcPattern = /Blockchain ID[|\s]+([A-Za-z0-9]+)/i;
        const bcMatch = cleanOutput.match(bcPattern);
        if (bcMatch) blockchainId = bcMatch[1].trim();
      }

      // 3. Extract Node ID (Critical for Validators list)
      // Patterns: "NodeID: NodeID-..." or table "| NodeID-... |"
      const nodeIdPatterns = [
        /NodeID:\s*(NodeID-[A-Za-z0-9]+)/,
        /\|\s*(NodeID-[A-Za-z0-9]+)\s*\|/
      ];

      for (const pattern of nodeIdPatterns) {
        const match = cleanOutput.match(pattern);
        if (match) {
          extractedNodeId = match[1].trim();
          this.logger.log(`Extracted Node ID: ${extractedNodeId}`);
          break;
        }
      }

      // Verify RPC URL is complete
      if (extractedRpcUrl && !extractedRpcUrl.includes('/ext/bc/') && blockchainId) {
        // If we only got base URI (e.g. http://127.0.0.1:9654), append path
        extractedRpcUrl = `${extractedRpcUrl}/ext/bc/${blockchainId}/rpc`;
      } else if (!extractedRpcUrl) {
        // Default fallback
        extractedRpcUrl = `http://127.0.0.1:9650/ext/bc/${blockchainId}/rpc`;
      }

      this.logger.log(`Final RPC URL: ${extractedRpcUrl}, Blockchain ID: ${blockchainId}, Node ID: ${extractedNodeId}`);

      // Persist Validator if Node ID found
      if (extractedNodeId && subnet && subnet.id) {
        try {
          // Creating validator record linked to this subnet
          await this.prisma.validator.upsert({
            where: {
              networkId_nodeId: {
                networkId: subnet.id,
                nodeId: extractedNodeId
              }
            },
            create: {
              nodeId: extractedNodeId,
              networkId: subnet.id,
              weight: 1,
              stakeAmount: '2000000000', // 2000 AVAX
              connected: true,
              startTime: new Date(),
              endTime: new Date(Date.now() + 31536000000) // 1 year expiry
            },
            update: {
              connected: true,
              startTime: new Date()
            }
          });
          this.logger.log(`Persisted Local Validator ${extractedNodeId} for subnet ${subnet.id}`);
        } catch (e) {
          this.logger.warn(`Failed to persist validator record: ${e}`);
        }
      }

      if (subnet) {
        subnet.status = 'RUNNING';
        subnet.blockchainId = blockchainId;
        subnet.subnetId = subnetId;
        subnet.chainId = chainId.toString();
        subnet.rpcUrl = extractedRpcUrl;
        subnet.wsUrl = extractedRpcUrl.replace('http://', 'ws://').replace('/rpc', '/ws');
        subnet.cliVersion = 'avalanche-cli';
        await this.persistSubnet(subnet);
      }

      await this.appendLog(operationId, '✅ Subnet deployment on Avalanche completed.');

      const op = operations.get(operationId);
      if (op) {
        op.status = 'COMPLETED';
        op.completedAt = new Date();
      }
    } catch (error) {
      const subnet = subnets.get(subnetId);
      if (subnet) {
        subnet.status = 'FAILED';
        await this.persistSubnet(subnet);
      }

      const op = operations.get(operationId);
      if (op) {
        op.status = 'FAILED';
        op.completedAt = new Date();
      }

      await this.appendLog(operationId, `❌ ${String(error)}`);
      throw error;
    }
  }

  private async createGenesisFile(subnetId: string, config: any, workdir: string): Promise<string> {
    const fs = await import('fs/promises');
    const path = await import('path');

    let genesis: any;

    // Priority 1: Use full genesis data generated by frontend wizard (preserves all user settings)
    if (config.genesisData && typeof config.genesisData === 'object') {
      this.logger.log(`Using frontend-generated genesis for ${subnetId} (allocations: ${Object.keys((config.genesisData as any).alloc || {}).length})`);
      genesis = config.genesisData;

      // Ensure chainId in genesis matches what we have in config
      if (genesis.config && config.chainId) {
        genesis.config.chainId = Number(config.chainId);
      }
    } else {
      // Priority 2: Fallback to template (when called directly without frontend wizard)
      this.logger.log(`Generating fallback genesis template for ${subnetId}`);
      const blockTimestamp = Math.floor(Date.now() / 1000);

      const genesisConfig: any = {
        chainId: Number(config.chainId),
        homesteadBlock: 0,
        eip150Block: 0,
        eip150Hash: '0x2086799aeebeae135c246c65021c82b4e15a2c451340993aac94e9d400c292cf',
        eip155Block: 0,
        eip158Block: 0,
        byzantiumBlock: 0,
        constantinopleBlock: 0,
        petersburgBlock: 0,
        istanbulBlock: 0,
        muirGlacierBlock: 0,
        feeConfig: {
          gasLimit: config.gasLimit || 15000000,
          minBaseFee: parseInt(config.minBaseFee || '25000000000'),
          targetGas: config.gasLimit || 15000000,
          baseFeeChangeDenominator: 48,
          minBlockGasCost: 0,
          maxBlockGasCost: 1000000,
          blockGasCostStep: 200000,
          targetBlockRate: config.targetBlockRate || 2,
        },
      };

      // Add allowlists if provided
      if (config.contractDeployerAllowlist?.enabled) {
        genesisConfig.contractDeployerAllowListConfig = {
          blockTimestamp,
          adminAddresses: config.contractDeployerAllowlist.adminAddresses || [],
          managerAddresses: config.contractDeployerAllowlist.managerAddresses || [],
          enabledAddresses: config.contractDeployerAllowlist.enabledAddresses || [],
        };
      }
      if (config.transactionAllowlist?.enabled) {
        genesisConfig.txAllowListConfig = {
          blockTimestamp,
          adminAddresses: config.transactionAllowlist.adminAddresses || [],
          managerAddresses: config.transactionAllowlist.managerAddresses || [],
          enabledAddresses: config.transactionAllowlist.enabledAddresses || [],
        };
      }
      if (config.feeManagerAllowlist?.enabled) {
        genesisConfig.feeManagerConfig = {
          blockTimestamp,
          adminAddresses: config.feeManagerAllowlist.adminAddresses || [],
          managerAddresses: config.feeManagerAllowlist.managerAddresses || [],
          enabledAddresses: config.feeManagerAllowlist.enabledAddresses || [],
        };
      }
      if (config.nativeMinter) {
        genesisConfig.contractNativeMinterConfig = {
          blockTimestamp,
          adminAddresses: config.contractDeployerAllowlist?.adminAddresses || [
            config.validatorManagerOwner || '0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC'
          ],
        };
      }

      // Default alloc
      const defaultAdmin = (config.validatorManagerOwner || '0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC').replace(/^0x/, '');
      genesis = {
        config: genesisConfig,
        alloc: {
          '8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC': { balance: '0x52B7D2DCC80CD2E4000000' },
          ...(defaultAdmin.toLowerCase() !== '8db97c7cece249c2b98bdc0226cc4c2a57bf52fc' ? {
            [defaultAdmin]: { balance: '0x' + BigInt(config.tokenSupply || '100000000000000000000000000').toString(16) }
          } : {}),
        },
        nonce: '0x0',
        timestamp: '0x0',
        extraData: '0x',
        gasLimit: '0x' + (config.gasLimit || 15000000).toString(16),
        difficulty: '0x0',
        mixHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        coinbase: '0x0000000000000000000000000000000000000000',
        number: '0x0',
        gasUsed: '0x0',
        parentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      };
    }

    const genesisPath = path.join(workdir, `${subnetId}-genesis.json`);
    await fs.writeFile(genesisPath, JSON.stringify(genesis, null, 2));
    this.logger.log(`Genesis file written to ${genesisPath}`);
    return genesisPath;
  }

  /**
   * HYBRID approach: After CLI creates genesis with proper PoA contracts,
   * patch it with user's custom allocations, feeConfig, and allowlists.
   * This preserves all CLI-generated contract bytecodes while applying user customizations.
   */
  private async patchGenesisFile(
    subnetId: string,
    config: any,
    cliPath: string,
    workdir: string,
    operationId: string,
  ): Promise<void> {
    const { spawn } = await import('child_process');

    // Read genesis from WSL: ~/.avalanche-cli/subnets/<subnetId>/genesis.json
    // Use bash -c so that ~ expands correctly
    const wslGenesisPath = `~/.avalanche-cli/subnets/${subnetId}/genesis.json`;
    const distro = process.env.AVALANCHE_WSL_DISTRO || 'Ubuntu-22.04';

    this.logger.log(`Patching genesis at WSL path: ${wslGenesisPath}`);
    this.logger.log(`Config genesisData keys: ${config.genesisData ? Object.keys(config.genesisData) : 'none'}`);
    this.logger.log(`Config genesisData alloc count: ${config.genesisData?.alloc ? Object.keys(config.genesisData.alloc).length : 0}`);

    // Read current genesis via WSL bash -c (ensures ~ expands)
    let genesisJson: string;
    try {
      genesisJson = await new Promise<string>((resolve, reject) => {
        const proc = spawn('wsl', ['-d', distro, '--', 'bash', '-c', `cat ${wslGenesisPath}`], {
          cwd: workdir
        });
        let output = '';
        proc.stdout.on('data', (d: Buffer) => output += d.toString());
        proc.stderr.on('data', (d: Buffer) => this.logger.warn(`patch read stderr: ${d}`));
        proc.on('close', (code: number) => code === 0 ? resolve(output) : reject(new Error(`cat genesis failed: code ${code}`)));
      });
    } catch (e) {
      this.logger.warn(`Could not read genesis for patching: ${e}. Skipping patch.`);
      return;
    }

    let genesis: any;
    try {
      genesis = JSON.parse(genesisJson);
    } catch (e) {
      this.logger.warn(`Could not parse genesis JSON: ${e}. Skipping patch.`);
      return;
    }

    this.logger.log(`Read CLI genesis: ${Object.keys(genesis.alloc || {}).length} alloc entries, chainId=${genesis.config?.chainId}`);
    let patched = false;

    // 1. Merge custom allocations (add new addresses, preserve existing contract bytecodes)
    if (config.genesisData?.alloc) {
      const userAlloc = config.genesisData.alloc as Record<string, any>;
      if (!genesis.alloc) genesis.alloc = {};
      for (const [addr, data] of Object.entries(userAlloc)) {
        const normalizedAddr = addr.toLowerCase().replace(/^0x/, '');
        // Only add if not already in genesis (don't overwrite CLI contracts)
        if (!genesis.alloc[normalizedAddr]) {
          genesis.alloc[normalizedAddr] = data;
          this.logger.log(`Patched alloc: added ${normalizedAddr} with balance ${data.balance}`);
          patched = true;
        } else {
          this.logger.log(`Patched alloc: ${normalizedAddr} already exists (preserving CLI contract)`);
        }
      }
    }

    // 2. Patch feeConfig if user provided custom values
    if (config.genesisData?.config?.feeConfig && genesis.config) {
      const userFee = config.genesisData.config.feeConfig;
      genesis.config.feeConfig = { ...genesis.config.feeConfig, ...userFee };
      this.logger.log(`Patched feeConfig: gasLimit=${userFee.gasLimit}, minBaseFee=${userFee.minBaseFee}`);
      patched = true;
    }

    // 3. Patch allowlists
    if (config.genesisData?.config) {
      const userConfig = config.genesisData.config as any;
      if (userConfig.contractDeployerAllowListConfig && genesis.config) {
        genesis.config.contractDeployerAllowListConfig = userConfig.contractDeployerAllowListConfig;
        this.logger.log('Patched contractDeployerAllowListConfig');
        patched = true;
      }
      if (userConfig.txAllowListConfig && genesis.config) {
        genesis.config.txAllowListConfig = userConfig.txAllowListConfig;
        this.logger.log('Patched txAllowListConfig');
        patched = true;
      }
      if (userConfig.feeManagerConfig && genesis.config) {
        genesis.config.feeManagerConfig = userConfig.feeManagerConfig;
        this.logger.log('Patched feeManagerConfig');
        patched = true;
      }
      if (userConfig.warpConfig && genesis.config) {
        genesis.config.warpConfig = { ...genesis.config.warpConfig, ...userConfig.warpConfig };
        this.logger.log('Patched warpConfig');
        patched = true;
      }
    }

    // 4. Update top-level gasLimit if changed
    if (config.genesisData?.gasLimit) {
      genesis.gasLimit = config.genesisData.gasLimit;
      patched = true;
    }

    if (!patched) {
      this.logger.log('No patches needed for genesis');
      return;
    }

    // Write patched genesis back via WSL
    const patchedJson = JSON.stringify(genesis, null, 2);
    try {
      await new Promise<void>((resolve, reject) => {
        const proc = spawn('wsl', ['-d', distro, '--', 'bash', '-c', `cat > ${wslGenesisPath}`], {
          cwd: workdir
        });
        proc.stdin.write(patchedJson);
        proc.stdin.end();
        proc.on('close', (code: number) => code === 0 ? resolve() : reject(new Error(`write genesis failed: code ${code}`)));
      });
      this.logger.log(`✅ Patched genesis written back (${Object.keys(genesis.alloc || {}).length} alloc entries)`);
      await this.appendLog(operationId, `Patched genesis with custom allocations and config`);
    } catch (e) {
      this.logger.error(`Failed to write patched genesis: ${e}`);
    }
  }

  private async appendLog(operationId: string, line: string): Promise<void> {
    const operation = operations.get(operationId);
    if (operation) {
      const entry = `${new Date().toISOString()} ${line}`;
      operation.log = [operation.log, entry].filter(Boolean).join('\n');
    }
  }

  private async runCommand(
    command: string,
    args: string[],
    operationId: string,
    cwd: string,
  ): Promise<void> {
    await this.runCommandWithOutput(command, args, operationId, cwd);
  }

  private async runCommandWithOutput(
    command: string,
    args: string[],
    operationId: string,
    cwd: string,
  ): Promise<string> {
    const { spawn } = await import('child_process');

    // Detect if running on Windows
    const isWindows = process.platform === 'win32';

    let finalCommand = command;
    let finalArgs = args;

    // If on Windows, wrap command with wsl targeting Ubuntu-22.04
    if (isWindows) {
      // Check if command is already wsl
      if (command !== 'wsl') {
        const distro = process.env.AVALANCHE_WSL_DISTRO || 'Ubuntu-22.04';
        // Use -- to separate wsl args from command args to avoid confusion
        finalArgs = ['-d', distro, '--', command, ...args];
        finalCommand = 'wsl';
      }
    }

    const fullCommand = `${finalCommand} ${finalArgs.join(' ')}`;

    this.logger.log(`Running (${process.platform}): ${fullCommand}`);
    await this.appendLog(operationId, `$ ${fullCommand}`);

    let capturedOutput = '';

    await new Promise<void>((resolve, reject) => {
      const proc = spawn(finalCommand, finalArgs, {
        cwd,
        shell: true,
        env: {
          ...process.env,
          AVALANCHE_CLI_SKIP_UPDATE: 'true',
          CI: 'true', // Force non-interactive mode
        },
      });

      proc.stdout.on('data', (data) => {
        const output = data.toString();
        capturedOutput += output;
        this.logger.log(`STDOUT: ${output}`);
        this.appendLog(operationId, output);
      });

      proc.stderr.on('data', (data) => {
        const output = data.toString();
        capturedOutput += output; // Also capture stderr as CLI may output info there
        this.logger.warn(`STDERR: ${output}`);
        this.appendLog(operationId, output);
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          this.logger.error(`Command failed with exit code ${code}`);
          reject(new Error(`${fullCommand} exited with code ${code}`));
        }
      });

      proc.on('error', (err) => {
        this.logger.error(`Command error: ${err.message}`);
        reject(err);
      });
    });

    return capturedOutput;
  }

  private async parseSubnetMetadata(subnetId: string, workdir: string) {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const outputDir = path.join(workdir, 'output', subnetId);
      const metaPath = path.join(outputDir, 'metadata.json');
      const raw = await fs.readFile(metaPath, 'utf-8');
      return JSON.parse(raw) as {
        subnetId?: string;
        chainId?: string;
        rpcUrl?: string;
        cliVersion?: string;
      };
    } catch (error) {
      this.logger.warn(`Could not read subnet metadata ${subnetId}: ${String(error)}`);
      return null;
    }
  }

  // Start a stopped subnet
  async start(id: string, userId?: string) {
    const subnet = subnets.get(id);
    if (!subnet) {
      throw new NotFoundException(`Subnet ${id} không tồn tại`);
    }

    if (userId && subnet.ownerAddress && subnet.ownerAddress !== userId) {
      throw new ForbiddenException('You do not have permission to manage this subnet');
    }

    if (subnet.status === 'RUNNING') {
      return { message: 'Subnet already running', subnet };
    }

    const release = await cliMutex.acquire();
    this.logger.log(`Acquired lock for starting subnet ${id}`);

    try {
      const path = require('path');
      const fs = require('fs');
      const isWindows = process.platform === 'win32';
      const binaryName = isWindows ? 'avalanche.exe' : 'avalanche';
      const localCliPath = path.join(process.cwd(), 'bin', binaryName);

      const cliPath = process.env.AVALANCHE_CLI_PATH || (
        fs.existsSync(localCliPath) ? localCliPath : null
      );

      if (!cliPath) {
        throw new Error('Thiếu biến môi trường AVALANCHE_CLI_PATH');
      }

      const operationId = `op${Date.now()}`;
      const operation: SubnetOperation = {
        id: operationId,
        subnetId: id,
        type: 'START',
        status: 'RUNNING',
        log: '',
        createdAt: new Date(),
      };
      operations.set(operationId, operation);

      subnet.status = 'STARTING';

      // Use avalanche network start command with --skip-update-check
      await this.runCommand(cliPath, ['network', 'start', '--skip-update-check'], operationId, process.cwd());

      subnet.status = 'RUNNING';
      operation.status = 'COMPLETED';
      operation.completedAt = new Date();

      this.logger.log(`Subnet ${id} started successfully`);
      return { message: 'Subnet started successfully', subnet };
    } catch (error) {
      subnet.status = 'FAILED';
      this.logger.error(`Failed to start subnet ${id}: ${error}`);
      throw error;
    } finally {
      release();
      this.logger.log(`Released lock for subnet ${id}`);
    }
  }

  // Stop a running subnet
  async stop(id: string, userId?: string) {
    const subnet = subnets.get(id);
    if (!subnet) {
      throw new NotFoundException(`Subnet ${id} không tồn tại`);
    }

    if (userId && subnet.ownerAddress && subnet.ownerAddress !== userId) {
      throw new ForbiddenException('You do not have permission to manage this subnet');
    }

    if (subnet.status === 'STOPPED') {
      return { message: 'Subnet already stopped', subnet };
    }

    const release = await cliMutex.acquire();
    this.logger.log(`Acquired lock for stopping subnet ${id}`);

    try {
      const path = require('path');
      const fs = require('fs');
      const isWindows = process.platform === 'win32';
      const binaryName = isWindows ? 'avalanche.exe' : 'avalanche';
      const localCliPath = path.join(process.cwd(), 'bin', binaryName);

      const cliPath = process.env.AVALANCHE_CLI_PATH || (
        fs.existsSync(localCliPath) ? localCliPath : null
      );

      if (!cliPath) {
        throw new Error('Thiếu biến môi trường AVALANCHE_CLI_PATH');
      }

      const operationId = `op${Date.now()}`;
      const operation: SubnetOperation = {
        id: operationId,
        subnetId: id,
        type: 'STOP',
        status: 'RUNNING',
        log: '',
        createdAt: new Date(),
      };
      operations.set(operationId, operation);

      subnet.status = 'STOPPING';

      // Use avalanche network stop command with --skip-update-check
      await this.runCommand(cliPath, ['network', 'stop', '--skip-update-check'], operationId, process.cwd());

      subnet.status = 'STOPPED';
      operation.status = 'COMPLETED';
      operation.completedAt = new Date();

      this.logger.log(`Subnet ${id} stopped successfully`);
      return { message: 'Subnet stopped successfully', subnet };
    } catch (error) {
      subnet.status = 'FAILED';
      this.logger.error(`Failed to stop subnet ${id}: ${error}`);
      throw error;
    } finally {
      release();
      this.logger.log(`Released lock for subnet ${id}`);
    }
  }

  // Delete a subnet
  async delete(id: string, userId?: string) {
    const subnet = subnets.get(id);
    if (!subnet) {
      throw new NotFoundException(`Subnet ${id} không tồn tại`);
    }

    if (userId && subnet.ownerAddress && subnet.ownerAddress !== userId) {
      throw new ForbiddenException('You do not have permission to manage this subnet');
    }

    const release = await cliMutex.acquire();
    this.logger.log(`Acquired lock for deleting subnet ${id}`);

    try {
      const cliPath = process.env.AVALANCHE_CLI_PATH;
      if (!cliPath) {
        throw new Error('Thiếu biến môi trường AVALANCHE_CLI_PATH');
      }

      const operationId = `op${Date.now()}`;
      const operation: SubnetOperation = {
        id: operationId,
        subnetId: id,
        type: 'DELETE',
        status: 'RUNNING',
        log: '',
        createdAt: new Date(),
      };
      operations.set(operationId, operation);

      subnet.status = 'DELETING';

      // Use avalanche blockchain delete command
      try {
        await this.runCommand(
          cliPath,
          ['blockchain', 'delete', id, '--skip-update-check'],
          operationId,
          process.cwd()
        );
      } catch (err) {
        // Delete might fail if blockchain doesn't exist in CLI, but we still remove from our storage
        this.logger.warn(`CLI delete failed (may be expected): ${err}`);
      }

      // Remove from in-memory storage
      subnets.delete(id);

      // Remove from DB to prevent ghosts
      try {
        await this.prisma.network.delete({ where: { id } });
      } catch (e) {
        this.logger.warn(`Failed to delete from DB (might already be gone): ${e}`);
      }

      // Clean up operations for this subnet
      for (const [opId, op] of operations) {
        if (op.subnetId === id) {
          operations.delete(opId);
        }
      }

      operation.status = 'COMPLETED';
      operation.completedAt = new Date();

      this.logger.log(`Subnet ${id} deleted successfully`);
      return { message: 'Subnet deleted successfully' };
    } catch (error) {
      subnet.status = 'FAILED';
      this.logger.error(`Failed to delete subnet ${id}: ${error}`);
      throw error;
    } finally {
      release();
      this.logger.log(`Released lock for subnet ${id}`);
    }
  }

  // Get subnet status
  async getStatus(id: string) {
    const subnet = subnets.get(id);
    if (!subnet) {
      throw new NotFoundException(`Subnet ${id} không tồn tại`);
    }

    return {
      id: subnet.id,
      name: subnet.name,
      status: subnet.status,
      rpcUrl: subnet.rpcUrl,
      chainId: subnet.chainId,
      blockchainId: subnet.blockchainId,
    };
  }
  private async configureLocalNode(cliPath: string, workdir: string) {
    try {
      this.logger.log('Configuring local node for external access...');
      const { execSync } = require('child_process');
      const isWSL = cliPath.includes('wsl');

      if (isWSL) {
        // Backend runs on Windows, CLI configs live in WSL filesystem
        // Use a simple node script inside WSL to update all config.json files
        const nodeScript = `
const fs=require('fs'),p=require('path'),
d=p.join(require('os').homedir(),'.avalanche-cli','local');
if(!fs.existsSync(d)){console.log('No local dir');process.exit(0)}
let n=0;
fs.readdirSync(d).forEach(sub=>{
  const f=p.join(d,sub,'config.json');
  if(!fs.existsSync(f))return;
  try{
    const c=JSON.parse(fs.readFileSync(f,'utf8'));
    if(!c.defaultFlags)c.defaultFlags={};
    c.defaultFlags['http-host']='0.0.0.0';
    c.defaultFlags['http-allowed-hosts']='*';
    fs.writeFileSync(f,JSON.stringify(c,null,2));
    n++;
  }catch(e){}
});
console.log('Updated '+n+' configs');
`.replace(/\n/g, ' ').trim();

        const output = execSync(
          `wsl -d Ubuntu-22.04 -- node -e "${nodeScript.replace(/"/g, '\\"')}"`,
          { timeout: 15000 }
        ).toString().trim();
        this.logger.log(`Config injection: ${output}`);
      } else {
        // Direct filesystem (Linux/Mac)
        const path = require('path');
        const fs = require('fs');
        const localDir = path.join(require('os').homedir(), '.avalanche-cli', 'local');
        if (!fs.existsSync(localDir)) {
          this.logger.warn('No local network configs found');
          return;
        }
        let updated = 0;
        for (const sub of fs.readdirSync(localDir)) {
          const configPath = path.join(localDir, sub, 'config.json');
          if (!fs.existsSync(configPath)) continue;
          try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            if (!config.defaultFlags) config.defaultFlags = {};
            config.defaultFlags['http-host'] = '0.0.0.0';
            config.defaultFlags['http-allowed-hosts'] = '*';
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            updated++;
          } catch { }
        }
        this.logger.log(`Updated ${updated} local network config(s)`);
      }
    } catch (e: any) {
      this.logger.warn(`Failed to inject node config: ${e.message}`);
    }
  }
}
