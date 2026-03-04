// Genesis Configuration Generator Utility
// Generates Avalanche Subnet-EVM Genesis JSON from form data

export interface TokenAllocation {
    address: string;
    amount: string; // in wei or full units
}

export interface FeeConfig {
    gasLimit: number;
    minBaseFee: number; // in gwei
    baseFeeChangeDenominator: number;
    minBlockGasCost: number;
    maxBlockGasCost: number;
    blockGasCostStep: number;
    targetGas: number;
    targetBlockRate: number;
}

export interface AllowlistConfig {
    enabled: boolean;
    adminAddresses: string[];
    managerAddresses: string[];
    enabledAddresses: string[];
}

export interface PredeployConfig {
    transparentProxy: boolean;
    proxyAdminContract: boolean;
    icmMessenger: boolean;
    wrappedNative: boolean;
    safeSingletonFactory: boolean;
    multicall3: boolean;
    create2Deployer: boolean;
}

export interface GenesisFormData {
    chainId: string;
    tokenName: string;
    tokenSymbol: string;
    allocations: TokenAllocation[];
    nativeMinter: boolean;
    feeConfig: FeeConfig;
    contractDeployerAllowlist: AllowlistConfig;
    transactionAllowlist: AllowlistConfig;
    feeManagerAllowlist: AllowlistConfig;
    rewardManagerAllowlist: AllowlistConfig;
    predeploys: PredeployConfig;
}

// Default fee configuration matching Avalanche defaults
export const defaultFeeConfig: FeeConfig = {
    gasLimit: 15000000,
    minBaseFee: 25, // 25 gwei
    baseFeeChangeDenominator: 48,
    minBlockGasCost: 0,
    maxBlockGasCost: 1000000,
    blockGasCostStep: 200000,
    targetGas: 15000000,
    targetBlockRate: 2,
};

// Default allowlist config
export const defaultAllowlist: AllowlistConfig = {
    enabled: false,
    adminAddresses: [],
    managerAddresses: [],
    enabledAddresses: [],
};

// Default predeploys
export const defaultPredeploys: PredeployConfig = {
    transparentProxy: true,
    proxyAdminContract: true,
    icmMessenger: true,
    wrappedNative: true,
    safeSingletonFactory: true,
    multicall3: true,
    create2Deployer: false,
};

// Default form data
export const defaultGenesisFormData: GenesisFormData = {
    chainId: '27923',
    tokenName: 'COIN Token',
    tokenSymbol: 'COIN',
    allocations: [],
    nativeMinter: false,
    feeConfig: defaultFeeConfig,
    contractDeployerAllowlist: defaultAllowlist,
    transactionAllowlist: defaultAllowlist,
    feeManagerAllowlist: defaultAllowlist,
    rewardManagerAllowlist: defaultAllowlist,
    predeploys: defaultPredeploys,
};

// Convert token amount to wei (assuming 18 decimals)
function toWei(amount: string): string {
    try {
        const num = parseFloat(amount);
        if (isNaN(num)) return '0x0';
        // Convert to wei (multiply by 10^18)
        const wei = BigInt(Math.floor(num * 1e18));
        return '0x' + wei.toString(16);
    } catch {
        return '0x0';
    }
}

// Generate allowlist precompile config
function generateAllowlistConfig(config: AllowlistConfig, blockTimestamp: number) {
    if (!config.enabled) return null;

    return {
        blockTimestamp,
        adminAddresses: config.adminAddresses.filter(a => a.length > 0),
        managerAddresses: config.managerAddresses.filter(a => a.length > 0),
        enabledAddresses: config.enabledAddresses.filter(a => a.length > 0),
    };
}

// Generate allocations (alloc) section
function generateAllocations(allocations: TokenAllocation[]): Record<string, { balance: string }> {
    const alloc: Record<string, { balance: string }> = {};

    for (const allocation of allocations) {
        if (allocation.address && allocation.amount) {
            // Remove 0x prefix for alloc keys
            const addr = allocation.address.startsWith('0x')
                ? allocation.address.slice(2).toLowerCase()
                : allocation.address.toLowerCase();
            alloc[addr] = {
                balance: toWei(allocation.amount),
            };
        }
    }

    return alloc;
}

// Main genesis generator
export function generateGenesisConfig(formData: GenesisFormData): object {
    const blockTimestamp = Math.floor(Date.now() / 1000);
    const chainId = parseInt(formData.chainId) || 27923;

    // Build config object
    const config: Record<string, any> = {
        chainId,
        berlinBlock: 0,
        byzantiumBlock: 0,
        constantinopleBlock: 0,
        eip150Block: 0,
        eip155Block: 0,
        eip158Block: 0,
        homesteadBlock: 0,
        istanbulBlock: 0,
        londonBlock: 0,
        muirGlacierBlock: 0,
        petersburgBlock: 0,

        // Fee configuration
        feeConfig: {
            baseFeeChangeDenominator: formData.feeConfig.baseFeeChangeDenominator,
            blockGasCostStep: formData.feeConfig.blockGasCostStep,
            maxBlockGasCost: formData.feeConfig.maxBlockGasCost,
            minBaseFee: formData.feeConfig.minBaseFee * 1e9, // Convert gwei to wei
            minBlockGasCost: formData.feeConfig.minBlockGasCost,
            targetGas: formData.feeConfig.targetGas,
            gasLimit: formData.feeConfig.gasLimit,
            targetBlockRate: formData.feeConfig.targetBlockRate,
        },

        // Warp configuration for ICM
        warpConfig: {
            blockTimestamp,
            quorumNumerator: 67,
            requirePrimaryNetworkSigners: true,
            enabled: formData.predeploys.icmMessenger,
        },
    };

    // Add allowlists if enabled
    const contractDeployerConfig = generateAllowlistConfig(
        formData.contractDeployerAllowlist,
        blockTimestamp
    );
    if (contractDeployerConfig) {
        config.contractDeployerAllowListConfig = contractDeployerConfig;
    }

    const txAllowlistConfig = generateAllowlistConfig(
        formData.transactionAllowlist,
        blockTimestamp
    );
    if (txAllowlistConfig) {
        config.txAllowListConfig = txAllowlistConfig;
    }

    const feeManagerConfig = generateAllowlistConfig(
        formData.feeManagerAllowlist,
        blockTimestamp
    );
    if (feeManagerConfig) {
        config.feeManagerConfig = feeManagerConfig;
    }

    // Native minter
    if (formData.nativeMinter) {
        config.contractNativeMinterConfig = {
            blockTimestamp,
            adminAddresses: formData.contractDeployerAllowlist.adminAddresses.filter(a => a.length > 0),
        };
    }

    // Build full genesis
    const genesis: Record<string, any> = {
        config,
        alloc: generateAllocations(formData.allocations),
        difficulty: '0x0',
        excessBlobGas: null,
        extraData: '0x',
        gasLimit: '0x' + formData.feeConfig.gasLimit.toString(16),
        gasUsed: '0x0',
        mixHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        nonce: '0x0',
        number: '0x0',
        parentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        timestamp: '0x' + blockTimestamp.toString(16),
        baseFeePerGas: null,
        blobGasUsed: null,
        coinbase: '0x0000000000000000000000000000000000000000',
    };

    return genesis;
}

// Calculate genesis file size
export function calculateGenesisSize(genesis: object): number {
    return new Blob([JSON.stringify(genesis, null, 2)]).size;
}

// Format bytes to human readable
export function formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KiB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MiB';
}

// Genesis size limit (64 KiB is the safe limit)
export const GENESIS_SIZE_LIMIT = 64 * 1024;
