import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Mutex } from 'async-mutex';
import { LogsService } from '../logs/logs.service';
import { PrismaService } from '../prisma/prisma.service';

export interface DeployedContract {
    id: string;
    name: string;
    address: string;
    subnetId: string; // 'primary' or subnet ID
    ownerAddress?: string; // Wallet address of the owner
    rpcUrl?: string; // RPC URL of the network where contract is deployed
    abi: any[];
    deployedAt: string;
    txHash: string;
}

@Injectable()
export class ContractsService implements OnModuleInit {
    private readonly logger = new Logger(ContractsService.name);
    // In-memory storage for now
    private contracts: DeployedContract[] = [];
    private readonly deployMutex = new Mutex(); // Prevent Nonce collisions

    constructor(
        private readonly logsService: LogsService,
        private prisma: PrismaService
    ) { }

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

    async onModuleInit() {
        try {
            const dbContracts = await (this.prisma as any).contract.findMany();
            this.contracts = dbContracts.map((c: any) => ({
                id: c.id,
                name: c.name,
                address: c.address,
                subnetId: c.networkId,
                ownerAddress: c.deployedBy || undefined,
                rpcUrl: c.rpcUrl || undefined,
                abi: c.abi || [],
                deployedAt: c.deployedAt.toISOString(),
                txHash: c.txHash || ''
            }));
            this.logger.log(`Loaded ${this.contracts.length} contracts from database`);
        } catch (e) {
            this.logger.error("Failed to load contracts from DB", e);
        }
    }

    findAll(subnetId?: string, ownerAddress?: string) {
        let result = this.contracts;

        if (ownerAddress) {
            result = result.filter(c => c.ownerAddress?.toLowerCase() === ownerAddress.toLowerCase());
        }

        if (subnetId) {
            result = result.filter(c => c.subnetId === subnetId);
        }

        return result;
    }

    async create(contract: Omit<DeployedContract, 'id' | 'deployedAt'>) {
        const newContract = {
            ...contract,
            id: Math.random().toString(36).substring(7),
            deployedAt: new Date().toISOString()
        };
        this.contracts.push(newContract);
        this.logger.log(`Registered new contract: ${newContract.name} at ${newContract.address} (Owner: ${newContract.ownerAddress})`);

        // Persist to DB
        try {
            const networkId = contract.subnetId;
            // Ensure Network exists (Create placeholder if missing to satisfy FK)
            const networkExists = await (this.prisma as any).network.findUnique({ where: { id: networkId } });
            if (!networkExists) {
                try {
                    await (this.prisma as any).network.create({
                        data: {
                            id: networkId,
                            name: networkId === 'primary' ? 'Primary Network' : 'Unknown Network',
                            chainId: networkId === 'primary' ? 43112 : 0,
                            status: 'RUNNING'
                        }
                    });
                } catch (e) {
                    // Ignore duplicate creation race
                }
            }

            await (this.prisma as any).contract.create({
                data: {
                    id: newContract.id,
                    name: newContract.name,
                    address: newContract.address,
                    abi: newContract.abi,
                    txHash: newContract.txHash,
                    networkId: networkId,
                    deployedBy: newContract.ownerAddress,
                    rpcUrl: newContract.rpcUrl || null,
                    deployedAt: newContract.deployedAt
                } as any
            });
        } catch (e) {
            this.logger.error(`Failed to persist contract ${newContract.id}`, e);
        }

        return newContract;
    }

    async deployContract(deployDto: {
        name: string;
        sourceCode: string; // Not used for now, just for record
        bytecode: string;
        abi: any;
        network: string;
        args: any[];
    }) {
        const release = await this.deployMutex.acquire();
        try {
            const { ethers } = await import('ethers');

            // Default EWOQ Key for local network
            const PRIVATE_KEY = process.env.PRIVATE_KEY || '56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027';

            // Determine RPC URL
            // Ensure we use the correct port (9650)
            let rpcUrl = 'http://127.0.0.1:9650/ext/bc/C/rpc';

            // If targeting a subnet, we need its RPC URL
            // For now, allow passing custom RPC URL in 'network' field or assume local C-Chain
            if (deployDto.network && deployDto.network.startsWith('http')) {
                rpcUrl = deployDto.network;
            } else if (deployDto.network !== 'LOCAL' && deployDto.network !== 'C') {
                // Try to find subnet RPC from registry? 
                // For simplicity in this test, we default to C-Chain if not URL
            }

            if (!await this.isRpcReachable(rpcUrl)) {
                throw new Error('Avalanche node is offline. Please start the node first.');
            }
            const provider = new ethers.JsonRpcProvider(rpcUrl);
            const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

            this.logger.log(`Deploying ${deployDto.name} to ${rpcUrl}...`);
            this.logsService.log(`Starting deployment of ${deployDto.name} to network...`);

            const factory = new ethers.ContractFactory(deployDto.abi, deployDto.bytecode, wallet);

            const contract = await factory.deploy(...(deployDto.args || []));
            await contract.waitForDeployment();

            const address = await contract.getAddress();
            const txHash = contract.deploymentTransaction()?.hash;

            const deployedContract: DeployedContract = {
                id: Math.random().toString(36).substring(7),
                name: deployDto.name,
                address: address,
                subnetId: deployDto.network,
                abi: typeof deployDto.abi === 'string' ? JSON.parse(deployDto.abi) : deployDto.abi,
                deployedAt: new Date().toISOString(),
                txHash: txHash || ''
            };

            this.contracts.push(deployedContract);
            this.logger.log(`✅ Deployed ${deployDto.name} at ${address}`);
            this.logsService.success(`Successfully deployed ${deployDto.name} at ${address}`);

            return {
                status: 'success',
                address,
                transactionHash: txHash,
                blockNumber: await provider.getBlockNumber()
            };

        } catch (error) {
            this.logger.error(`Deployment failed: ${error}`);
            if (error instanceof Error) {
                throw new Error(`Deployment failed: ${error.message}`);
            }
            throw new Error(`Deployment failed: ${String(error)}`);
        } finally {
            release();
        }
    }

    // Resolve the real RPC URL for a contract (handles legacy contracts with null/proxy URLs)
    private async resolveRpcUrl(contractData: DeployedContract): Promise<string> {
        // Special case: primary network
        if (!contractData.subnetId || contractData.subnetId === 'primary' || contractData.subnetId === 'primary-c-chain') {
            return 'http://127.0.0.1:9650/ext/bc/C/rpc';
        }

        // If stored rpcUrl looks like a real RPC URL, verify contract exists there
        if (contractData.rpcUrl && !contractData.rpcUrl.includes('/rpc/proxy/') && contractData.rpcUrl.includes('/ext/bc/')) {
            if (await this.contractExistsAt(contractData.address, contractData.rpcUrl)) {
                return contractData.rpcUrl;
            }
            this.logger.warn(`Contract ${contractData.address} NOT found at stored rpcUrl ${contractData.rpcUrl}`);
        }

        // Fallback 1: look up Network table by subnetId
        try {
            const network = await (this.prisma as any).network.findUnique({
                where: { id: contractData.subnetId },
                select: { rpcUrl: true, name: true }
            });
            if (network?.rpcUrl && await this.contractExistsAt(contractData.address, network.rpcUrl)) {
                contractData.rpcUrl = network.rpcUrl;
                this.logger.log(`Found contract at Network "${network.name}": ${network.rpcUrl}`);
                return network.rpcUrl;
            }
        } catch (e) { /* ignore */ }

        // Fallback 2: search ALL networks with rpcUrl
        try {
            const allNetworks = await (this.prisma as any).network.findMany({
                where: { rpcUrl: { not: null }, status: 'RUNNING' },
                select: { id: true, rpcUrl: true, name: true }
            });
            for (const net of allNetworks) {
                if (net.rpcUrl && await this.contractExistsAt(contractData.address, net.rpcUrl)) {
                    contractData.rpcUrl = net.rpcUrl;
                    contractData.subnetId = net.id;
                    this.logger.log(`Auto-discovered contract at Network "${net.name}": ${net.rpcUrl}`);
                    // Update DB
                    try {
                        await (this.prisma as any).contract.update({
                            where: { id: contractData.id },
                            data: { rpcUrl: net.rpcUrl, networkId: net.id }
                        });
                    } catch (e) { /* ignore update errors */ }
                    return net.rpcUrl;
                }
            }
        } catch (e) {
            this.logger.warn(`Network search failed: ${e}`);
        }

        // Fallback 3: try C-Chain
        const cChainUrl = 'http://127.0.0.1:9650/ext/bc/C/rpc';
        if (await this.contractExistsAt(contractData.address, cChainUrl)) {
            return cChainUrl;
        }

        this.logger.error(`Contract ${contractData.address} not found on ANY network!`);
        return cChainUrl; // Return C-Chain anyway, let ethers throw a descriptive error
    }

    // Check if a contract exists at the given address on the given RPC URL
    private async contractExistsAt(address: string, rpcUrl: string): Promise<boolean> {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 3000);
            const res = await fetch(rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0', id: 1,
                    method: 'eth_getCode',
                    params: [address, 'latest']
                }),
                signal: controller.signal,
            });
            clearTimeout(timeout);
            if (!res.ok) return false;
            const data = await res.json();
            return data.result && data.result !== '0x' && data.result.length > 2;
        } catch {
            return false;
        }
    }

    async readContract(id: string, method: string, args: any[]) {
        const contractData = this.contracts.find(c => c.id === id);
        if (!contractData) throw new Error('Contract not found');

        const { ethers } = await import('ethers');
        const rpcUrl = await this.resolveRpcUrl(contractData);

        if (!await this.isRpcReachable(rpcUrl)) {
            throw new Error(`Node is offline at ${rpcUrl}. Cannot read contract.`);
        }
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const contract = new ethers.Contract(contractData.address, contractData.abi, provider);

        try {
            const result = await contract[method](...(args || []));
            // Convert BigInt to string for JSON serialization
            return this.sanitizeResult(result);
        } catch (e: any) {
            throw new Error(`Read failed: ${e.message}`);
        }
    }

    async writeContract(id: string, method: string, args: any[]) {
        const release = await this.deployMutex.acquire();
        let rpcUrl = 'unknown';
        let contractData: DeployedContract | undefined;
        try {
            contractData = this.contracts.find(c => c.id === id);
            if (!contractData) throw new Error('Contract not found');

            const { ethers } = await import('ethers');
            rpcUrl = await this.resolveRpcUrl(contractData);
            this.logger.log(`WRITE ${method} on contract ${contractData.address} via RPC: ${rpcUrl} (subnetId: ${contractData.subnetId})`);

            const PRIVATE_KEY = process.env.PRIVATE_KEY || '56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027';
            if (!await this.isRpcReachable(rpcUrl)) {
                throw new Error(`Node is offline at ${rpcUrl}. Cannot write to contract.`);
            }
            const provider = new ethers.JsonRpcProvider(rpcUrl);
            const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
            const contract = new ethers.Contract(contractData.address, contractData.abi, wallet);

            // Try normal call first, fallback to manual gasLimit if estimateGas fails
            let tx;
            try {
                tx = await contract[method](...(args || []));
            } catch (estimateErr: any) {
                if (estimateErr.code === 'CALL_EXCEPTION' && estimateErr.message?.includes('estimateGas')) {
                    this.logger.warn(`estimateGas failed, retrying with manual gasLimit: ${estimateErr.message}`);
                    // Bypass estimateGas by setting gasLimit manually
                    tx = await contract[method](...(args || []), { gasLimit: 500000n });
                } else {
                    throw estimateErr;
                }
            }
            const receipt = await tx.wait();

            return {
                hash: tx.hash,
                blockNumber: receipt.blockNumber,
                status: receipt.status
            };
        } catch (e: any) {
            throw new Error(`Write failed [rpc=${rpcUrl}, subnet=${contractData?.subnetId}]: ${e.message}`);
        } finally {
            release();
        }
    }

    private sanitizeResult(result: any): any {
        if (typeof result === 'bigint') return result.toString();
        if (Array.isArray(result)) return result.map(r => this.sanitizeResult(r));
        return result;
    }
}
