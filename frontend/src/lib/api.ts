const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Helper function for fetch with error handling
async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options?.headers as Record<string, string>,
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
        ...options,
        headers,
    });

    if (!res.ok) {
        const error = await res.text();
        throw new Error(error || `HTTP ${res.status}`);
    }

    return res.json();
}

// Types matching backend responses
export interface Subnet {
    id: string;
    name: string;
    subnetId?: string;
    blockchainId?: string;
    rpcUrl?: string;
    wsUrl?: string;
    vmType: string;
    chainId?: number;
    status: 'creating' | 'active' | 'failed' | 'pending' | 'RUNNING' | 'DRAFT' | 'CREATING' | 'DEPLOYING' | 'FAILED';
    validators?: number;
    createdAt?: string;
    tokenSymbol?: string;
}

export interface Validator {
    id: string;
    nodeId: string;
    subnetId?: string;
    stake?: string;
    startTime?: string;
    endTime?: string;
    delegationFee?: number;
    uptime?: number;
    status?: 'active' | 'pending' | 'inactive';
}

export interface DeployedContract {
    id: string;
    name: string;
    address: string;
    subnetId?: string;
    abi: any[];
    txHash?: string;
    deployedAt: string;
    networkName?: string;
    chainId?: number | string;
    type?: string;
    transactions?: number;
    status?: 'verified' | 'pending';
    ownerAddress?: string;
}

export interface DashboardStats {
    healthy: boolean;
    version?: string;
    networkName?: string;
    blockHeight?: number;
    peerCount?: number;
    pendingTxs?: number;
    gasPrice?: string;
    tps?: number;
    nodeOffline?: boolean;
}

export interface RecentBlock {
    height: number;
    hash?: string;
    transactions: number;
    timestamp?: string;
    size?: string;
    validator?: string;
}

// API Client
export const api = {
    subnets: {
        list: (ownerAddress?: string): Promise<Subnet[]> => {
            const params = new URLSearchParams();
            if (ownerAddress) params.append('ownerAddress', ownerAddress);
            const queryString = params.toString();
            return fetchJson(`${API_BASE}/subnets${queryString ? `?${queryString}` : ''}`);
        },

        create: (data: {
            name: string;
            vmType: string;
            chainId?: number;
            tokenSymbol?: string;
            tokenSupply?: string;
            gasLimit?: number;
            minBaseFee?: string;
            targetBlockRate?: number;
            validatorManagerOwner?: string;
            configMode?: string;
            validatorType?: string;
            enableICM?: boolean;
            ownerAddress?: string;
        }): Promise<Subnet> =>
            fetchJson(`${API_BASE}/subnets`, {
                method: 'POST',
                body: JSON.stringify(data),
            }),

        get: (id: string): Promise<Subnet> =>
            fetchJson(`${API_BASE}/subnets/${id}`),

        start: (id: string): Promise<{ message: string; subnet: Subnet }> =>
            fetchJson(`${API_BASE}/subnets/${id}/start`, { method: 'POST' }),

        stop: (id: string): Promise<{ message: string; subnet: Subnet }> =>
            fetchJson(`${API_BASE}/subnets/${id}/stop`, { method: 'POST' }),

        delete: (id: string): Promise<{ message: string }> =>
            fetchJson(`${API_BASE}/subnets/${id}`, { method: 'DELETE' }),

        status: (id: string): Promise<{ id: string; name: string; status: string; rpcUrl?: string }> =>
            fetchJson(`${API_BASE}/subnets/${id}/status`),
    },

    validators: {
        list: (subnetId?: string): Promise<Validator[]> =>
            fetchJson(`${API_BASE}/validators${subnetId ? `?subnetId=${subnetId}` : ''}`),

        add: (data: { nodeId?: string; subnetId?: string; stake?: string; runInDocker?: boolean }): Promise<Validator> =>
            fetchJson(`${API_BASE}/validators`, {
                method: 'POST',
                body: JSON.stringify(data),
            }),

        remove: (id: string): Promise<void> =>
            fetchJson(`${API_BASE}/validators/${id}`, { method: 'DELETE' }),
    },

    contracts: {
        list: (subnetId?: string, ownerAddress?: string): Promise<DeployedContract[]> => {
            const params = new URLSearchParams();
            if (subnetId) params.append('subnetId', subnetId);
            if (ownerAddress) params.append('ownerAddress', ownerAddress);
            const queryString = params.toString();
            return fetchJson(`${API_BASE}/contracts${queryString ? `?${queryString}` : ''}`);
        },

        create: (data: Partial<DeployedContract>): Promise<DeployedContract> =>
            fetchJson(`${API_BASE}/contracts`, {
                method: 'POST',
                body: JSON.stringify(data),
            }),

        deploy: (data: {
            name: string;
            sourceCode?: string;
            bytecode: string;
            abi: any;
            network: string;
            args?: any[];
        }): Promise<DeployedContract> =>
            fetchJson(`${API_BASE}/contracts/deploy`, {
                method: 'POST',
                body: JSON.stringify(data),
            }),

        read: (id: string, method: string, args?: any[]): Promise<any> =>
            fetchJson(`${API_BASE}/contracts/${id}/read`, {
                method: 'POST',
                body: JSON.stringify({ method, args }),
            }),

        write: (id: string, method: string, args?: any[]): Promise<any> =>
            fetchJson(`${API_BASE}/contracts/${id}/write`, {
                method: 'POST',
                body: JSON.stringify({ method, args }),
            }),
    },

    node: {
        dashboard: (rpcUrl?: string): Promise<DashboardStats> =>
            fetchJson(`${API_BASE}/node/dashboard${rpcUrl ? `?rpcUrl=${encodeURIComponent(rpcUrl)}` : ''}`),

        blocks: (rpcUrl?: string): Promise<RecentBlock[]> =>
            fetchJson(`${API_BASE}/node/blocks${rpcUrl ? `?rpcUrl=${encodeURIComponent(rpcUrl)}` : ''}`),

        transactions: (rpcUrl?: string): Promise<any[]> =>
            fetchJson(`${API_BASE}/node/transactions${rpcUrl ? `?rpcUrl=${encodeURIComponent(rpcUrl)}` : ''}`),

        status: (rpcUrl?: string): Promise<{ healthy: boolean; version?: string }> =>
            fetchJson(`${API_BASE}/node/status${rpcUrl ? `?rpcUrl=${encodeURIComponent(rpcUrl)}` : ''}`),
    },

    monitoring: {
        status: (): Promise<{
            prometheusRunning: boolean;
            grafanaRunning: boolean;
            status?: string;
            grafanaUrl?: string | null;
            prometheusUrl?: string | null;
        }> =>
            fetchJson(`${API_BASE}/monitoring/status`),

        start: (): Promise<{ success: boolean }> =>
            fetchJson(`${API_BASE}/monitoring/start`, { method: 'POST' }),

        stop: (): Promise<{ success: boolean }> =>
            fetchJson(`${API_BASE}/monitoring/stop`, { method: 'POST' }),
    },

    benchmarks: {
        list: (): Promise<any[]> =>
            fetchJson(`${API_BASE}/benchmarks`),

        runTpsTest: (config: {
            rpcUrl: string;
            duration: number;
            txPerSecond: number;
            concurrency: number;
        }): Promise<{
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
        }> =>
            fetchJson(`${API_BASE}/benchmarks/run-tps`, {
                method: 'POST',
                body: JSON.stringify(config),
            }),

        runReadTest: (rpcUrl?: string, iterations?: number): Promise<{
            avgLatency: number;
            minLatency: number;
            maxLatency: number;
            successRate: number;
        }> =>
            fetchJson(`${API_BASE}/benchmarks/read-test?rpcUrl=${encodeURIComponent(rpcUrl || '')}&iterations=${iterations || 100}`),
    },

    alerts: {
        list: (limit: number = 50): Promise<any[]> =>
            fetchJson(`${API_BASE}/alerts?limit=${limit}`),

        create: (data: any): Promise<any> =>
            fetchJson(`${API_BASE}/alerts`, {
                method: 'POST',
                body: JSON.stringify(data),
            }),
    },

    metrics: {
        getLive: (): Promise<any> =>
            fetchJson(`${API_BASE}/metrics/live`),

        list: (limit: number = 20): Promise<any[]> =>
            fetchJson(`${API_BASE}/metrics?limit=${limit}`),

        create: (data: any): Promise<any> =>
            fetchJson(`${API_BASE}/metrics`, {
                method: 'POST',
                body: JSON.stringify(data),
            }),
    },

    pchain: {
        getValidators: (subnetId?: string): Promise<any[]> =>
            fetchJson(`${API_BASE}/pchain/validators${subnetId ? `?subnetId=${subnetId}` : ''}`),

        getSubnets: (): Promise<any[]> =>
            fetchJson(`${API_BASE}/pchain/subnets`),
    },

    bridge: {
        transfer: (data: any): Promise<any> =>
            fetchJson(`${API_BASE}/bridge/transfer`, {
                method: 'POST',
                body: JSON.stringify(data),
            }),

        history: (): Promise<any[]> =>
            fetchJson(`${API_BASE}/bridge/history`),
    },

    config: {
        validateGenesis: (data: any): Promise<{ valid: boolean; message?: string }> =>
            fetchJson(`${API_BASE}/config/validate-genesis`, {
                method: 'POST',
                body: JSON.stringify(data),
            }),
    },

    networkRunner: {
        getStatus: async () => {
            const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
            const headers = token ? { 'Authorization': `Bearer ${token}` } : undefined;
            const response = await fetch(`${API_BASE}/network-runner/status`, { headers });
            return handleResponse(response);
        },
        addNode: async (name: string) => {
            const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
            const response = await fetch(`${API_BASE}/network-runner/add-node`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ name }),
            });
            return handleResponse(response);
        },
        removeNode: async (name: string) => {
            const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
            const headers = token ? { 'Authorization': `Bearer ${token}` } : undefined;
            const response = await fetch(`${API_BASE}/network-runner/remove-node?name=${name}`, {
                method: 'DELETE',
                headers,
            });
            return handleResponse(response);
        },
    },
};

// Helper for handling response properly
const handleResponse = async (res: Response) => {
    if (!res.ok) {
        const error = await res.text();
        throw new Error(error || `HTTP ${res.status}`);
    }
    return res.json();
};

export default api;
