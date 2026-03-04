"use client";

import { useState, useEffect } from "react";
import {
    Settings as SettingsIcon,
    Server,
    Database,
    Key,
    Globe,
    Save,
    RefreshCw,
    CheckCircle,
    AlertCircle,
    Copy,
    ExternalLink
} from "lucide-react";
import { useNetwork } from "@/context/NetworkContext";

interface SettingsState {
    avalancheNodeHost: string;
    avalancheNodePort: string;
    avalancheCliPath: string;
    avalancheWslDistro: string;
    backendUrl: string;
}

export function SettingsPanel() {
    const { selectedNetwork, networks } = useNetwork();
    const [settings, setSettings] = useState<SettingsState>({
        avalancheNodeHost: "127.0.0.1",
        avalancheNodePort: "9650",
        avalancheCliPath: "avalanche",
        avalancheWslDistro: "Ubuntu-22.04",
        backendUrl: "http://localhost:4000"
    });
    const [saving, setSaving] = useState(false);
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [copied, setCopied] = useState<string | null>(null);

    // Load settings from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('baas-settings');
        if (saved) {
            try {
                setSettings(JSON.parse(saved));
            } catch { }
        }
    }, []);

    const handleSave = () => {
        setSaving(true);
        localStorage.setItem('baas-settings', JSON.stringify(settings));
        setTimeout(() => setSaving(false), 500);
    };

    const testConnection = async () => {
        setTestStatus('testing');
        try {
            const res = await fetch(`${settings.backendUrl}/node/status`);
            if (res.ok) {
                setTestStatus('success');
            } else {
                setTestStatus('error');
            }
        } catch {
            setTestStatus('error');
        }
        setTimeout(() => setTestStatus('idle'), 3000);
    };

    const copyToClipboard = async (text: string, key: string) => {
        await navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <SettingsIcon className="h-6 w-6 text-slate-400" />
                    Settings
                </h2>
                <p className="text-slate-400">Configure your BaaS platform settings.</p>
            </div>

            {/* Connection Settings */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Server className="h-5 w-5 text-blue-400" />
                    Node Connection
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">Avalanche Node Host</label>
                        <input
                            type="text"
                            value={settings.avalancheNodeHost}
                            onChange={e => setSettings({ ...settings, avalancheNodeHost: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="127.0.0.1"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">Node Port</label>
                        <input
                            type="text"
                            value={settings.avalancheNodePort}
                            onChange={e => setSettings({ ...settings, avalancheNodePort: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="9650"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">Backend API URL</label>
                        <input
                            type="text"
                            value={settings.backendUrl}
                            onChange={e => setSettings({ ...settings, backendUrl: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="http://localhost:4000"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={testConnection}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                            {testStatus === 'testing' ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : testStatus === 'success' ? (
                                <CheckCircle className="h-4 w-4 text-green-400" />
                            ) : testStatus === 'error' ? (
                                <AlertCircle className="h-4 w-4 text-red-400" />
                            ) : (
                                <RefreshCw className="h-4 w-4" />
                            )}
                            Test Connection
                        </button>
                    </div>
                </div>
            </div>

            {/* CLI Settings */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Key className="h-5 w-5 text-purple-400" />
                    Avalanche CLI Configuration
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">CLI Path</label>
                        <input
                            type="text"
                            value={settings.avalancheCliPath}
                            onChange={e => setSettings({ ...settings, avalancheCliPath: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                            placeholder="avalanche"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Path to the Avalanche CLI executable (or 'avalanche' if in PATH)
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">WSL Distro (Windows only)</label>
                        <input
                            type="text"
                            value={settings.avalancheWslDistro}
                            onChange={e => setSettings({ ...settings, avalancheWslDistro: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Ubuntu-22.04"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            WSL distribution name for running CLI commands on Windows
                        </p>
                    </div>
                </div>
            </div>

            {/* Network Info */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Globe className="h-5 w-5 text-green-400" />
                    Registered Networks ({networks.length})
                </h3>

                <div className="space-y-3">
                    {networks.map(network => (
                        <div
                            key={network.id}
                            className={`p-4 rounded-lg border ${selectedNetwork?.id === network.id
                                    ? 'border-blue-500/50 bg-blue-500/5'
                                    : 'border-slate-800 bg-slate-950'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-white">{network.name}</span>
                                        {network.isPrimary && (
                                            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                                                Primary
                                            </span>
                                        )}
                                        <span className={`text-xs px-1.5 py-0.5 rounded ${network.status === 'RUNNING'
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                            {network.status}
                                        </span>
                                    </div>
                                    <div className="text-sm text-slate-400 mt-1">
                                        Chain ID: {network.chainId} • {network.tokenSymbol}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => copyToClipboard(network.rpcUrl, network.id)}
                                        className="p-2 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                                        title="Copy RPC URL"
                                    >
                                        {copied === network.id ? (
                                            <CheckCircle className="h-4 w-4 text-green-400" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div className="mt-2 p-2 bg-slate-900 rounded text-xs font-mono text-slate-500 truncate">
                                {network.rpcUrl}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Environment Variables Reference */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Database className="h-5 w-5 text-yellow-400" />
                    Backend Environment Variables
                </h3>

                <div className="bg-slate-950 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                    <pre className="text-slate-400">
                        {`# Node Connection
AVALANCHE_NODE_HOST=${settings.avalancheNodeHost}
AVALANCHE_NODE_PORT=${settings.avalancheNodePort}
AVALANCHE_NODE_PROTOCOL=http

# Avalanche CLI
AVALANCHE_CLI_PATH=${settings.avalancheCliPath}
AVALANCHE_WSL_DISTRO=${settings.avalancheWslDistro}

# Database (optional)
DATABASE_URL=postgresql://user:pass@localhost:5432/baas

# Server
PORT=4000`}
                    </pre>
                </div>
                <p className="text-xs text-slate-500 mt-3">
                    Set these environment variables in your backend .env file
                </p>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50"
                >
                    {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Settings
                </button>
            </div>
        </div>
    );
}
