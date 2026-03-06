"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// Network type definition
export interface Network {
    id: string;
    name: string;
    chainId: number;
    rpcUrl: string;
    directRpcUrl?: string; // Direct RPC URL (for ethers.js, not proxied)
    wsUrl?: string;
    tokenSymbol: string;
    status: "PENDING" | "DEPLOYING" | "CREATING" | "RUNNING" | "FAILED" | "DRAFT";
    vmType: string;
    network: "LOCAL" | "TESTNET" | "MAINNET";
    blockchainId?: string;
    subnetId?: string;
    createdAt: string;
    isPrimary?: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const PROXY_URL = `${API_URL}/rpc/proxy`;

// Primary Network (C-Chain) - using Proxy for stability
const PRIMARY_NETWORK: Network = {
    id: "primary-c-chain",
    name: "Primary Network (C-Chain)",
    chainId: 43112, // Local C-Chain
    rpcUrl: `${PROXY_URL}/primary-c-chain`,
    directRpcUrl: "http://127.0.0.1:9650/ext/bc/C/rpc",
    wsUrl: "ws://127.0.0.1:9650/ext/bc/C/ws", // WS might still need direct or proxying, but HTTP is priority
    tokenSymbol: "AVAX",
    status: "RUNNING",
    vmType: "coreth",
    network: "LOCAL",
    createdAt: new Date().toISOString(),
    isPrimary: true,
};

interface NetworkContextType {
    // State
    networks: Network[];
    selectedNetwork: Network | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    selectNetwork: (network: Network) => void;
    refreshNetworks: (account?: string) => Promise<void>;
    addNetwork: (network: Network) => void;
    updateNetworkStatus: (networkId: string, status: Network["status"]) => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

interface NetworkProviderProps {
    children: ReactNode;
}

export function NetworkProvider({ children }: NetworkProviderProps) {
    const { token, isLoading: authLoading } = useAuth();
    const [networks, setNetworks] = useState<Network[]>([PRIMARY_NETWORK]);
    const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(PRIMARY_NETWORK);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch networks from backend — chỉ gọi khi có token
    const refreshNetworks = useCallback(async (account?: string) => {
        if (!token) return;           // Không có token → bỏ qua, tránh 401
        setIsLoading(true);
        setError(null);
        try {
            const subnets = await api.subnets.list(account);

            const networkList: Network[] = [
                PRIMARY_NETWORK,
                ...subnets.map((subnet: any) => ({
                    id: subnet.id,
                    name: subnet.name,
                    chainId: subnet.chainId ? Number(subnet.chainId) : (subnet.config?.chainId || 0),
                    rpcUrl: `${PROXY_URL}/${subnet.id}`,
                    directRpcUrl: subnet.rpcUrl || undefined, // Real RPC URL from backend (for ethers.js)
                    tokenSymbol: subnet.tokenSymbol || subnet.config?.tokenSymbol || "TOKEN",
                    status: subnet.status,
                    vmType: subnet.vmType,
                    network: subnet.network,
                    blockchainId: subnet.blockchainId,
                    subnetId: subnet.subnetId,
                    createdAt: subnet.createdAt,
                    isPrimary: false,
                })),
            ];
            setNetworks(networkList);

            // Dùng functional update để không phụ thuộc selectedNetwork trong deps
            setSelectedNetwork(prev =>
                prev && !networkList.find(n => n.id === prev.id) ? PRIMARY_NETWORK : prev
            );
        } catch (err) {
            console.error("Failed to fetch networks:", err);
            setError("Failed to load networks");
        } finally {
            setIsLoading(false);
        }
    }, [token]);   // Chỉ phụ thuộc vào token

    // Select a network
    const selectNetwork = useCallback((network: Network) => {
        setSelectedNetwork(network);
        // Store in localStorage for persistence
        localStorage.setItem("selectedNetworkId", network.id);
    }, []);

    // Add a new network (used after creation)
    const addNetwork = useCallback((network: Network) => {
        setNetworks(prev => {
            // Avoid duplicates
            if (prev.find(n => n.id === network.id)) {
                return prev.map(n => n.id === network.id ? network : n);
            }
            return [...prev, network];
        });
    }, []);

    // Update network status
    const updateNetworkStatus = useCallback((networkId: string, status: Network["status"]) => {
        setNetworks(prev => prev.map(n =>
            n.id === networkId ? { ...n, status } : n
        ));
        if (selectedNetwork?.id === networkId) {
            setSelectedNetwork(prev => prev ? { ...prev, status } : null);
        }
    }, [selectedNetwork]);

    // Load khi auth sẵn sàng (authLoading=false và có token)
    useEffect(() => {
        if (authLoading || !token) return;

        refreshNetworks().then(() => {
            // Restore selected network from localStorage AFTER networks are loaded
            const savedNetworkId = localStorage.getItem("selectedNetworkId");
            if (savedNetworkId && savedNetworkId !== "primary-c-chain") {
                setNetworks(currentNetworks => {
                    const network = currentNetworks.find(n => n.id === savedNetworkId);
                    if (network) {
                        setSelectedNetwork(network);
                    }
                    return currentNetworks;
                });
            }
        });
    }, [authLoading, token]);   // Chạy lại khi login/logout

    // Poll for network status updates
    useEffect(() => {
        const interval = setInterval(() => {
            refreshNetworks();
        }, 10000); // Every 10 seconds
        return () => clearInterval(interval);
    }, [refreshNetworks]);

    const value: NetworkContextType = {
        networks,
        selectedNetwork,
        isLoading,
        error,
        selectNetwork,
        refreshNetworks,
        addNetwork,
        updateNetworkStatus,
    };

    return (
        <NetworkContext.Provider value={value}>
            {children}
        </NetworkContext.Provider>
    );
}

// Hook to use network context
export function useNetwork() {
    const context = useContext(NetworkContext);
    if (context === undefined) {
        throw new Error("useNetwork must be used within a NetworkProvider");
    }
    return context;
}

// Hook to get RPC URL for current network
export function useNetworkRpc() {
    const { selectedNetwork } = useNetwork();
    return selectedNetwork?.rpcUrl || PRIMARY_NETWORK.rpcUrl;
}
