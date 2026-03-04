"use client";

import { useState } from "react";
import {
    CheckCircle,
    Copy,
    Check,
    ExternalLink,
    ArrowRight,
    Info,
    Rocket
} from "lucide-react";
import { Network } from "@/context/NetworkContext";

interface SubnetCreatedModalProps {
    network: Network | null;
    isOpen: boolean;
    onClose: () => void;
    onViewDetails: () => void;
}

export function SubnetCreatedModal({ network, isOpen, onClose, onViewDetails }: SubnetCreatedModalProps) {
    const [copied, setCopied] = useState<string | null>(null);

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
        } catch (error) {
            console.error('Failed to add network:', error);
        }
    };

    if (!isOpen || !network) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="relative w-full max-w-lg bg-slate-900 rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
                {/* Success Header */}
                <div className="relative bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-8 text-center border-b border-slate-800">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-500/10 to-transparent" />
                    <div className="relative">
                        <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                            <CheckCircle className="h-8 w-8 text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Network Created!</h2>
                        <p className="text-slate-400">Your blockchain is being deployed</p>
                    </div>
                </div>

                {/* Network Info */}
                <div className="p-6 space-y-4">
                    {/* Name & Status */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Rocket className="h-5 w-5 text-blue-400" />
                            <span className="text-lg font-semibold text-white">{network.name}</span>
                        </div>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                            {network.status}
                        </span>
                    </div>

                    {/* Key Details */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                            <div className="text-xs text-slate-500 mb-1">Chain ID</div>
                            <div className="text-lg font-bold text-white">{network.chainId}</div>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                            <div className="text-xs text-slate-500 mb-1">Token</div>
                            <div className="text-lg font-bold text-white">{network.tokenSymbol}</div>
                        </div>
                    </div>

                    {/* RPC URL */}
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-500">RPC URL</span>
                            <button
                                onClick={() => copyToClipboard(network.rpcUrl, 'rpc')}
                                className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
                            >
                                {copied === 'rpc' ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                        </div>
                        <code className="text-xs text-blue-400 break-all">{network.rpcUrl}</code>
                    </div>

                    {/* Blockchain ID */}
                    {network.blockchainId && (
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-slate-500">Blockchain ID</span>
                                <button
                                    onClick={() => copyToClipboard(network.blockchainId!, 'bcid')}
                                    className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
                                >
                                    {copied === 'bcid' ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                                </button>
                            </div>
                            <code className="text-xs text-purple-400 break-all">{network.blockchainId}</code>
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                        <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-slate-300">
                                <p className="font-medium text-blue-400 mb-1">Next Steps:</p>
                                <ul className="list-disc list-inside space-y-1 text-slate-400">
                                    <li>Add this network to MetaMask using the button below</li>
                                    <li>Wait for deployment to complete (check status in Network Selector)</li>
                                    <li>Once running, you can deploy contracts and manage validators</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 pt-0 space-y-3">
                    <button
                        onClick={addToMetaMask}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-medium transition-colors"
                    >
                        <ExternalLink className="h-5 w-5" />
                        Add to MetaMask
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={onViewDetails}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition-colors"
                        >
                            <Info className="h-4 w-4" />
                            View Details
                        </button>
                        <button
                            onClick={onClose}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                        >
                            Continue
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
