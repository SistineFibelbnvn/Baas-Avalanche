"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Circle, Wifi, WifiOff, Copy, ExternalLink, Plus, Info } from "lucide-react";
import { useNetwork, Network } from "@/context/NetworkContext";
import { NetworkDetailsModal } from "./NetworkDetailsModal";

interface NetworkSelectorProps {
    onCreateNew?: () => void;
}

export function NetworkSelector({ onCreateNew }: NetworkSelectorProps) {
    const { networks, selectedNetwork, selectNetwork, isLoading, refreshNetworks } = useNetwork();
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [detailsNetwork, setDetailsNetwork] = useState<Network | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const copyRpcUrl = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedNetwork?.rpcUrl) {
            await navigator.clipboard.writeText(selectedNetwork.rpcUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const openNetworkDetails = (e: React.MouseEvent, network: Network) => {
        e.stopPropagation();
        setDetailsNetwork(network);
        setShowDetails(true);
        setIsOpen(false);
    };

    const getStatusColor = (status: Network["status"]) => {
        switch (status) {
            case "RUNNING":
                return "text-green-400";
            case "DEPLOYING":
            case "PENDING":
            case "CREATING":
                return "text-yellow-400";
            case "FAILED":
                return "text-red-400";
            default:
                return "text-slate-400";
        }
    };

    const getStatusIcon = (status: Network["status"]) => {
        switch (status) {
            case "RUNNING":
                return <Wifi className="h-3 w-3" />;
            case "FAILED":
                return <WifiOff className="h-3 w-3" />;
            default:
                return <Circle className="h-3 w-3 animate-pulse" />;
        }
    };

    return (
        <>
            <div className="relative" ref={dropdownRef}>
                {/* Selector Button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-left transition-all hover:border-slate-600 hover:bg-slate-800 min-w-[280px]"
                >
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className={`flex items-center ${getStatusColor(selectedNetwork?.status || "RUNNING")}`}>
                                {getStatusIcon(selectedNetwork?.status || "RUNNING")}
                            </span>
                            <span className="text-sm font-medium text-white truncate">
                                {selectedNetwork?.name || "Select Network"}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-500">
                                Chain ID: {selectedNetwork?.chainId || "N/A"}
                            </span>
                            <span className="text-xs text-slate-600">•</span>
                            <span className="text-xs text-slate-500">
                                {selectedNetwork?.tokenSymbol || "TOKEN"}
                            </span>
                        </div>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown */}
                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 rounded-lg border border-slate-700 bg-slate-900 shadow-xl z-50 overflow-hidden">
                        {/* Network List */}
                        <div className="max-h-64 overflow-y-auto">
                            {networks.map((network) => (
                                <div
                                    key={network.id}
                                    className={`flex items-center gap-2 px-4 py-3 transition-colors hover:bg-slate-800 ${selectedNetwork?.id === network.id ? "bg-slate-800/50" : ""
                                        }`}
                                >
                                    <button
                                        onClick={() => {
                                            selectNetwork(network);
                                            setIsOpen(false);
                                        }}
                                        className="flex-1 flex items-center gap-3 text-left"
                                    >
                                        <span className={`flex items-center ${getStatusColor(network.status)}`}>
                                            {getStatusIcon(network.status)}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-white truncate">
                                                    {network.name}
                                                </span>
                                                {network.isPrimary && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                                                        Primary
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs text-slate-500">
                                                    {network.chainId} • {network.tokenSymbol}
                                                </span>
                                            </div>
                                        </div>
                                        {selectedNetwork?.id === network.id && (
                                            <Check className="h-4 w-4 text-blue-500" />
                                        )}
                                    </button>
                                    {/* Info Button */}
                                    <button
                                        onClick={(e) => openNetworkDetails(e, network)}
                                        className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-white"
                                        title="View Details"
                                    >
                                        <Info className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="border-t border-slate-800 p-2">
                            {/* RPC URL Copy */}
                            {selectedNetwork && (
                                <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
                                    <span className="text-xs text-slate-500 truncate flex-1">
                                        {selectedNetwork.rpcUrl}
                                    </span>
                                    <button
                                        onClick={copyRpcUrl}
                                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                                        title="Copy RPC URL"
                                    >
                                        {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                                    </button>
                                </div>
                            )}

                            {/* Create New Button */}
                            {onCreateNew && (
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        onCreateNew();
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-blue-400 hover:bg-blue-500/10 transition-colors"
                                >
                                    <Plus className="h-4 w-4" />
                                    Create New Network
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Network Details Modal */}
            <NetworkDetailsModal
                network={detailsNetwork}
                isOpen={showDetails}
                onClose={() => setShowDetails(false)}
                onRefresh={refreshNetworks}
            />
        </>
    );
}

