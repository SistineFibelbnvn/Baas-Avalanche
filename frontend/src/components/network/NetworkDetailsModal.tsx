"use client";

import { useState, useEffect } from "react";
import {
    X,
    Copy,
    Check,
    ExternalLink,
    Wifi,
    Clock,
    Box,
    Hash,
    Coins,
    Loader2,
    AlertCircle,
    CheckCircle,
    RefreshCw
} from "lucide-react";
import { Network } from "@/context/NetworkContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface NetworkDetailsModalProps {
    network: Network | null;
    isOpen: boolean;
    onClose: () => void;
    onRefresh?: () => void;
}

export function NetworkDetailsModal({ network, isOpen, onClose, onRefresh }: NetworkDetailsModalProps) {
    const [copied, setCopied] = useState<string | null>(null);
    const [operations, setOperations] = useState<any[]>([]);
    const [loadingOps, setLoadingOps] = useState(false);

    useEffect(() => {
        if (isOpen && network && !network.isPrimary) {
            fetchOperations();
        }
    }, [isOpen, network]);

    const fetchOperations = async () => {
        if (!network) return;
        setLoadingOps(true);
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const res = await fetch(`${API_BASE}/subnets/${network.id}/operations`, { headers });
            if (res.ok) {
                const data = await res.json();
                setOperations(data);
            }
        } catch (e) {
            console.error("Failed to fetch operations", e);
        } finally {
            setLoadingOps(false);
        }
    };

    const copyToClipboard = async (text: string, key: string) => {
        await navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
    };

    const addToMetaMask = async () => {
        if (!network || !window.ethereum) return;

        const chainIdHex = '0x' + network.chainId.toString(16);

        try {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: chainIdHex,
                    chainName: network.name,
                    rpcUrls: [network.rpcUrl],
                    nativeCurrency: {
                        name: network.tokenSymbol,
                        symbol: network.tokenSymbol,
                        decimals: 18
                    }
                }]
            });
            alert('Network added to MetaMask!');
        } catch (error) {
            console.error('Failed to add network:', error);
        }
    };

    if (!isOpen || !network) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'RUNNING':
                return 'bg-green-500/10 text-green-400 border-green-500/30';
            case 'FAILED':
                return 'bg-red-500/10 text-red-400 border-red-500/30';
            case 'DEPLOYING':
            case 'CREATING':
                return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
            default:
                return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'RUNNING':
                return <CheckCircle className="h-4 w-4" />;
            case 'FAILED':
                return <AlertCircle className="h-4 w-4" />;
            case 'DEPLOYING':
            case 'CREATING':
                return <Loader2 className="h-4 w-4 animate-spin" />;
            default:
                return <Clock className="h-4 w-4" />;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-slate-900 rounded-xl border border-slate-800 shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 flex items-center justify-between border-b border-slate-800 bg-slate-900 p-6 z-10">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <Wifi className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white">{network.name}</h2>
                            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(network.status)}`}>
                                {getStatusIcon(network.status)}
                                {network.status}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {onRefresh && (
                            <button
                                onClick={onRefresh}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                                title="Refresh"
                            >
                                <RefreshCw className="h-5 w-5" />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Key Information Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                                <Hash className="h-4 w-4" />
                                Chain ID
                            </div>
                            <div className="text-xl font-bold text-white">{network.chainId}</div>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                                <Coins className="h-4 w-4" />
                                Token
                            </div>
                            <div className="text-xl font-bold text-white">{network.tokenSymbol}</div>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                                <Box className="h-4 w-4" />
                                VM
                            </div>
                            <div className="text-lg font-medium text-white truncate">{network.vmType}</div>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                                <Clock className="h-4 w-4" />
                                Network
                            </div>
                            <div className="text-lg font-medium text-white">{network.network}</div>
                        </div>
                    </div>

                    {/* RPC URL */}
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-300">RPC URL</span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => copyToClipboard(network.rpcUrl, 'rpc')}
                                    className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
                                    title="Copy"
                                >
                                    {copied === 'rpc' ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <code className="text-sm text-blue-400 break-all block bg-slate-900 p-2 rounded">
                            {network.rpcUrl}
                        </code>
                    </div>

                    {/* Blockchain ID (if available) */}
                    {network.blockchainId && (
                        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-slate-300">Blockchain ID</span>
                                <button
                                    onClick={() => copyToClipboard(network.blockchainId!, 'bcid')}
                                    className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
                                    title="Copy"
                                >
                                    {copied === 'bcid' ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                                </button>
                            </div>
                            <code className="text-sm text-purple-400 break-all block bg-slate-900 p-2 rounded">
                                {network.blockchainId}
                            </code>
                        </div>
                    )}

                    {/* Subnet ID (if available) */}
                    {network.subnetId && (
                        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-slate-300">Subnet ID</span>
                                <button
                                    onClick={() => copyToClipboard(network.subnetId!, 'snid')}
                                    className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
                                    title="Copy"
                                >
                                    {copied === 'snid' ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                                </button>
                            </div>
                            <code className="text-sm text-orange-400 break-all block bg-slate-900 p-2 rounded">
                                {network.subnetId}
                            </code>
                        </div>
                    )}

                    {/* MetaMask Button */}
                    {network.status === 'RUNNING' && !network.isPrimary && (
                        <button
                            onClick={addToMetaMask}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-medium transition-colors"
                        >
                            <ExternalLink className="h-5 w-5" />
                            Add to MetaMask
                        </button>
                    )}

                    {/* Deployment Logs */}
                    {!network.isPrimary && (
                        <div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-300">Deployment Logs</span>
                                {loadingOps && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                                {operations.length === 0 ? (
                                    <div className="p-4 text-sm text-slate-500 text-center">
                                        {loadingOps ? 'Loading...' : 'No deployment logs available'}
                                    </div>
                                ) : (
                                    <div className="p-4 font-mono text-xs text-slate-400 whitespace-pre-wrap">
                                        {operations.map((op) => (
                                            <div key={op.id} className="mb-2">
                                                <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${op.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                                                    op.status === 'FAILED' ? 'bg-red-500/20 text-red-400' :
                                                        'bg-yellow-500/20 text-yellow-400'
                                                    }`}>
                                                    {op.type}: {op.status}
                                                </div>
                                                {op.log && (
                                                    <pre className="mt-1 text-slate-500 text-[11px] overflow-x-auto">
                                                        {op.log.slice(-500)}
                                                    </pre>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Timestamps */}
                    <div className="text-xs text-slate-500 text-center">
                        Created: {new Date(network.createdAt).toLocaleString()}
                    </div>
                </div>
            </div>
        </div>
    );
}
