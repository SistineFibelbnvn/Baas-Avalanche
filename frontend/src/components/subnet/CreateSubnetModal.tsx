"use client";

import { useState } from "react";
import { X, Info } from "lucide-react";

interface CreateSubnetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (config: SubnetConfig) => void;
}

export interface SubnetConfig {
    name: string;
    vmType: "subnet-evm" | "custom";
    configMode: "test" | "production" | "custom";
    validatorType: "poa" | "pos";
    chainId: number;
    tokenSymbol: string;
    tokenSupply: string;
    gasLimit: number;
    minBaseFee: string;
    targetBlockRate: number;
    network: "LOCAL" | "TESTNET" | "MAINNET";
    validatorManagerOwner: string;
    vmVersion: "latest" | "pre-release" | "custom";
    enableICM: boolean;
}

export function CreateSubnetModal({ isOpen, onClose, onSubmit }: CreateSubnetModalProps) {
    const [config, setConfig] = useState<SubnetConfig>({
        name: "",
        vmType: "subnet-evm",
        configMode: "test",
        validatorType: "poa",
        chainId: Math.floor(Math.random() * 90000) + 10000,
        tokenSymbol: "AVXU",
        tokenSupply: "50000000",
        gasLimit: 20000000,
        minBaseFee: "25000000000",
        targetBlockRate: 2,
        network: "LOCAL",
        validatorManagerOwner: "0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC", // EWOQ address
        vmVersion: "latest",
        enableICM: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(config);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 rounded-xl border border-slate-800 shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 flex items-center justify-between border-b border-slate-800 bg-slate-900 p-6 z-10">
                    <div>
                        <h2 className="text-xl font-semibold text-white">Create New Blockchain</h2>
                        <p className="text-sm text-slate-400 mt-1">Configure your Avalanche L1 blockchain</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 text-xs">1</span>
                            Basic Information
                        </h3>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Blockchain Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={config.name}
                                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                                className="w-full rounded-md bg-slate-800 border border-slate-700 px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="myblockchain"
                            />
                            <p className="mt-1 text-xs text-slate-500">Only letters allowed, no special characters</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Virtual Machine
                                </label>
                                <select
                                    value={config.vmType}
                                    onChange={(e) => setConfig({ ...config, vmType: e.target.value as any })}
                                    className="w-full rounded-md bg-slate-800 border border-slate-700 px-4 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="subnet-evm">Subnet-EVM (Recommended)</option>
                                    <option value="custom">Custom VM</option>
                                </select>
                                <p className="mt-1 text-xs text-slate-500">Subnet-EVM is EVM-compatible</p>

                                {config.vmType === 'custom' && (
                                    <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                Custom VM Binary Path
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full rounded-md bg-slate-900 border border-slate-700 px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                placeholder="/path/to/vm/binary"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                Genesis File Path
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full rounded-md bg-slate-900 border border-slate-700 px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                placeholder="/path/to/genesis.json"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Network
                                </label>
                                <select
                                    value={config.network}
                                    onChange={(e) => setConfig({ ...config, network: e.target.value as any })}
                                    className="w-full rounded-md bg-slate-800 border border-slate-700 px-4 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="LOCAL">Local Network</option>
                                    <option value="TESTNET">Testnet (Fuji)</option>
                                    <option value="MAINNET">Mainnet</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Configuration Mode */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 text-xs">2</span>
                            Configuration Mode
                        </h3>

                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { value: "test", label: "Test", desc: "Default values for testing" },
                                { value: "production", label: "Production", desc: "Production-ready defaults" },
                                { value: "custom", label: "Custom", desc: "Full control over settings" },
                            ].map((mode) => (
                                <button
                                    key={mode.value}
                                    type="button"
                                    onClick={() => setConfig({ ...config, configMode: mode.value as any })}
                                    className={`relative rounded-lg border p-4 text-left transition-all ${config.configMode === mode.value
                                        ? "border-blue-500 bg-blue-500/10"
                                        : "border-slate-700 bg-slate-800 hover:border-slate-600"
                                        }`}
                                >
                                    <div className="font-medium text-white">{mode.label}</div>
                                    <div className="mt-1 text-xs text-slate-400">{mode.desc}</div>
                                    {config.configMode === mode.value && (
                                        <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-500"></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Validator Management */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 text-xs">3</span>
                            Validator Management
                        </h3>

                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { value: "poa", label: "Proof of Authority", desc: "Approved validators only" },
                                { value: "pos", label: "Proof of Stake", desc: "Stake-based validation" },
                            ].map((type) => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setConfig({ ...config, validatorType: type.value as any })}
                                    className={`relative rounded-lg border p-4 text-left transition-all ${config.validatorType === type.value
                                        ? "border-blue-500 bg-blue-500/10"
                                        : "border-slate-700 bg-slate-800 hover:border-slate-600"
                                        }`}
                                >
                                    <div className="font-medium text-white">{type.label}</div>
                                    <div className="mt-1 text-xs text-slate-400">{type.desc}</div>
                                    {config.validatorType === type.value && (
                                        <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-500"></div>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Validator Manager Owner Address *
                            </label>
                            <input
                                type="text"
                                required
                                value={config.validatorManagerOwner}
                                onChange={(e) => setConfig({ ...config, validatorManagerOwner: e.target.value })}
                                className="w-full rounded-md bg-slate-800 border border-slate-700 px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="0x..."
                            />
                            <p className="mt-1 text-xs text-slate-500">EVM address that controls ValidatorManager contract</p>
                        </div>
                    </div>

                    {/* Chain Configuration */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 text-xs">4</span>
                            Chain Configuration
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-1">
                                    Chain ID *
                                    <div className="group relative">
                                        <Info className="h-3 w-3 text-slate-500" />
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 rounded-md bg-slate-950 border border-slate-700 p-2 text-xs text-slate-300 shadow-lg">
                                            Must be unique for production. Avoid well-known IDs like 1 (Ethereum) or 43114 (Avalanche C-Chain).
                                        </div>
                                    </div>
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={config.chainId}
                                    onChange={(e) => setConfig({ ...config, chainId: parseInt(e.target.value) })}
                                    className="w-full rounded-md bg-slate-800 border border-slate-700 px-4 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Token Symbol *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={config.tokenSymbol}
                                    onChange={(e) => setConfig({ ...config, tokenSymbol: e.target.value.toUpperCase() })}
                                    className="w-full rounded-md bg-slate-800 border border-slate-700 px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="AVXU"
                                    maxLength={5}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Advanced Settings */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 text-xs">5</span>
                            Advanced Settings
                        </h3>

                        {config.configMode === 'custom' && (
                            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Gas Limit
                                    </label>
                                    <input
                                        type="number"
                                        value={config.gasLimit}
                                        onChange={(e) => setConfig({ ...config, gasLimit: parseInt(e.target.value) })}
                                        className="w-full rounded-md bg-slate-900 border border-slate-700 px-4 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Target Block Rate (s)
                                    </label>
                                    <input
                                        type="number"
                                        value={config.targetBlockRate}
                                        onChange={(e) => setConfig({ ...config, targetBlockRate: parseInt(e.target.value) })}
                                        className="w-full rounded-md bg-slate-900 border border-slate-700 px-4 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Min Base Fee (nAVAX)
                                    </label>
                                    <input
                                        type="text"
                                        value={config.minBaseFee}
                                        onChange={(e) => setConfig({ ...config, minBaseFee: e.target.value })}
                                        className="w-full rounded-md bg-slate-900 border border-slate-700 px-4 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    VM Version
                                </label>
                                <select
                                    value={config.vmVersion}
                                    onChange={(e) => setConfig({ ...config, vmVersion: e.target.value as any })}
                                    className="w-full rounded-md bg-slate-800 border border-slate-700 px-4 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="latest">Latest Release</option>
                                    <option value="pre-release">Latest Pre-release</option>
                                    <option value="custom">Custom Version</option>
                                </select>
                                {config.vmVersion === 'custom' && (
                                    <input
                                        type="text"
                                        className="mt-2 w-full rounded-md bg-slate-900 border border-slate-700 px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="v0.0.1"
                                    />
                                )}
                            </div>

                            <div className="flex items-center">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config.enableICM}
                                        onChange={(e) => setConfig({ ...config, enableICM: e.target.checked })}
                                        className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-slate-300">Enable ICM (Interoperability)</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Info Banner */}
                    <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
                        <div className="flex gap-3">
                            <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-slate-300">
                                <p className="font-medium text-blue-400 mb-1">Configuration Summary</p>
                                <p>
                                    Creating a <span className="font-semibold">{config.vmType === "subnet-evm" ? "Subnet-EVM" : "Custom VM"}</span> blockchain
                                    with <span className="font-semibold">{config.validatorType === "poa" ? "Proof of Authority" : "Proof of Stake"}</span> validation
                                    on <span className="font-semibold">{config.network.toLowerCase()}</span> network
                                    {config.enableICM && <span> with <span className="font-semibold">ICM enabled</span></span>}.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 flex items-center gap-2"
                        >
                            Create Blockchain
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
