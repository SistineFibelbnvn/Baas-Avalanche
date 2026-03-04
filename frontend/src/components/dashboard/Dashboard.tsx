"use client";

import { useEffect, useState } from "react";
import io, { Socket } from "socket.io-client";
import { Activity, Users, Server, BarChart, Play, Square, ExternalLink, Loader2, Database, Zap, Clock } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getAuthHeaders(): Record<string, string> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

interface NodeStatus {
    version: string | null;
    nodeId: string | null;
    networkId: number | null;
    networkName: string | null;
    peerCount: number | null;
    healthy: boolean | null;
    timestamp: string;
}

interface ChainStats {
    blockNumber: number | null;
    blockHeight: number | null;
    gasPrice: string | null;
    chainId: number | null;
    rpcUrl: string;
    online: boolean;
    error?: string;
    timestamp: string;
}

interface MonitoringStackStatus {
    status: 'RUNNING' | 'STOPPED' | 'UNKNOWN' | 'ERROR';
    services: any[];
}

interface Subnet {
    id: string;
    name: string;
    rpcUrl?: string;
    status: string;
}

export function Dashboard() {
    const [status, setStatus] = useState<NodeStatus | null>(null);
    const [chainStats, setChainStats] = useState<ChainStats | null>(null);
    const [connected, setConnected] = useState(false);

    // Monitoring Stack State
    const [monitoringStatus, setMonitoringStatus] = useState<MonitoringStackStatus | null>(null);
    const [loadingMonitoring, setLoadingMonitoring] = useState(false);

    // Subnet Selection State
    const [subnets, setSubnets] = useState<Subnet[]>([]);
    const [selectedSubnet, setSelectedSubnet] = useState<string>("primary");
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        // Connect to WebSocket
        const newSocket: Socket = io(`${API_BASE}/node-status`);
        setSocket(newSocket);

        newSocket.on("connect", () => {
            setConnected(true);
        });

        newSocket.on("disconnect", () => {
            setConnected(false);
        });

        newSocket.on("status", (data: NodeStatus) => {
            setStatus(data);
        });

        newSocket.on("chain-stats", (data: ChainStats) => {
            setChainStats(data);
        });

        // Initial fetch
        fetchMonitoringStatus();
        fetchSubnets();

        return () => {
            newSocket.disconnect();
        };
    }, []);

    // Effect to handle subscription when selected subnet changes
    useEffect(() => {
        if (!socket || !connected) return;

        if (selectedSubnet === 'primary') {
            setChainStats(null); // Clear chain stats
            // Could emit 'unsubscribe_chain' if implemented, but gateway handles per-client map
        } else {
            const subnet = subnets.find(s => s.id === selectedSubnet);
            if (subnet && subnet.rpcUrl) {
                socket.emit('subscribe_chain', { rpcUrl: subnet.rpcUrl, subnetName: subnet.name });
            }
        }
    }, [selectedSubnet, connected, socket, subnets]);

    const fetchSubnets = async () => {
        try {
            const res = await fetch(`${API_BASE}/subnets`, { headers: getAuthHeaders() });
            if (res.ok) {
                const data = await res.json();
                setSubnets(data);
            }
        } catch (error) {
            console.error("Failed to fetch subnets", error);
        }
    };

    const fetchMonitoringStatus = async () => {
        try {
            const res = await fetch(`${API_BASE}/monitoring/status`, { headers: getAuthHeaders() });
            const data = await res.json();
            setMonitoringStatus(data);
        } catch (error) {
            console.error("Failed to fetch monitoring status", error);
        }
    };

    const toggleMonitoring = async () => {
        if (!monitoringStatus) return;
        setLoadingMonitoring(true);
        const action = monitoringStatus.status === 'RUNNING' ? 'stop' : 'start';

        try {
            await fetch(`${API_BASE}/monitoring/${action}`, { method: 'POST', headers: getAuthHeaders() });
            setTimeout(fetchMonitoringStatus, 2000);
        } catch (error) {
            console.error(`Failed to ${action} monitoring`, error);
        } finally {
            setLoadingMonitoring(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header / Config Bar */}
            <div className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-800">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Activity className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                        <h2 className="text-white font-semibold">Monitoring Scope</h2>
                        <p className="text-sm text-slate-400">Select which network to monitor</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={selectedSubnet}
                        onChange={(e) => setSelectedSubnet(e.target.value)}
                        className="bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="primary">Primary Network (Node Health)</option>
                        <optgroup label="Your Subnets">
                            {subnets.map(subnet => (
                                <option key={subnet.id} value={subnet.id} disabled={subnet.status !== 'RUNNING'}>
                                    {subnet.name} {subnet.status !== 'RUNNING' && `(${subnet.status})`}
                                </option>
                            ))}
                        </optgroup>
                    </select>

                </div>
            </div>

            {/* Metric Cards - Conditional Render based on selection */}
            {selectedSubnet === 'primary' ? (
                // Primary Network Views
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Health Card */}
                    <div className={`p-6 rounded-xl border ${status?.healthy ? 'bg-green-500/10 border-green-500/20' : 'bg-slate-800 border-slate-700'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-slate-900 rounded-lg">
                                <Activity className={`h-6 w-6 ${status?.healthy ? 'text-green-500' : 'text-red-500'}`} />
                            </div>
                            {connected && <span className="flex h-3 w-3 rounded-full bg-green-500 animate-pulse" />}
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Node Status</p>
                            <h3 className="text-2xl font-bold text-white uppercase">{status?.healthy ? 'Healthy' : 'Unhealthy'}</h3>
                        </div>
                    </div>

                    {/* Peers Card */}
                    <div className="p-6 rounded-xl bg-slate-800 border border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-slate-900 rounded-lg">
                                <Users className="h-6 w-6 text-blue-500" />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Connected Peers</p>
                            <h3 className="text-2xl font-bold text-white">{status?.peerCount ?? 0}</h3>
                        </div>
                    </div>

                    {/* Network Card */}
                    <div className="p-6 rounded-xl bg-slate-800 border border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-slate-900 rounded-lg">
                                <Server className="h-6 w-6 text-purple-500" />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Network</p>
                            <h3 className="text-2xl font-bold text-white">{status?.networkName ?? 'Unknown'}</h3>
                            <p className="text-xs text-slate-500">ID: {status?.networkId}</p>
                        </div>
                    </div>

                    {/* Version Card */}
                    <div className="p-6 rounded-xl bg-slate-800 border border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-slate-900 rounded-lg">
                                <BarChart className="h-6 w-6 text-orange-500" />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Node Version</p>
                            <h3 className="text-lg font-bold text-white truncate" title={status?.version || ''}>{status?.version?.split('/')[1] ?? 'Unknown'}</h3>
                        </div>
                    </div>
                </div>
            ) : (
                // Subnet Specific Views
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Chain Status */}
                    <div className={`p-6 rounded-xl border ${chainStats?.online ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-slate-900 rounded-lg">
                                <Activity className={`h-6 w-6 ${chainStats?.online ? 'text-green-500' : 'text-red-500'}`} />
                            </div>
                            {connected && chainStats?.online && <span className="flex h-3 w-3 rounded-full bg-green-500 animate-pulse" />}
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Chain Status</p>
                            <h3 className="text-2xl font-bold text-white uppercase">{chainStats?.online ? 'Online' : 'Offline'}</h3>
                            {!chainStats?.online && chainStats?.error && (
                                <p className="text-xs text-red-400 mt-1 truncate">{chainStats.error}</p>
                            )}
                        </div>
                    </div>

                    {/* Block Height */}
                    <div className="p-6 rounded-xl bg-slate-800 border border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-slate-900 rounded-lg">
                                <Database className="h-6 w-6 text-blue-500" />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Block Height</p>
                            <h3 className="text-2xl font-bold text-white">#{chainStats?.blockHeight ?? 0}</h3>
                        </div>
                    </div>



                    {/* Gas Price */}
                    <div className="p-6 rounded-xl bg-slate-800 border border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-slate-900 rounded-lg">
                                <Zap className="h-6 w-6 text-yellow-500" />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Gas Price</p>
                            <h3 className="text-2xl font-bold text-white">{chainStats?.gasPrice ? `${parseFloat(chainStats.gasPrice).toFixed(2)} nAVAX` : '--'}</h3>
                        </div>
                    </div>

                    {/* Chain ID */}
                    <div className="p-6 rounded-xl bg-slate-800 border border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-slate-900 rounded-lg">
                                <Server className="h-6 w-6 text-purple-500" />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Chain ID</p>
                            <h3 className="text-2xl font-bold text-white">{chainStats?.chainId ?? '--'}</h3>
                        </div>
                    </div>
                </div >
            )}

            {/* Advanced Monitoring Section */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            Advanced Monitoring Stack
                            {monitoringStatus?.status === 'RUNNING' && (
                                <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs border border-green-500/20">Active</span>
                            )}
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">
                            Prometheus + Grafana + Loki + Alertmanager for comprehensive monitoring.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleMonitoring}
                            disabled={loadingMonitoring}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${monitoringStatus?.status === 'RUNNING'
                                ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                                : 'bg-blue-600 text-white hover:bg-blue-500'
                                }`}
                        >
                            {loadingMonitoring ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : monitoringStatus?.status === 'RUNNING' ? (
                                <>
                                    <Square className="h-4 w-4 fill-current" />
                                    Stop Stack
                                </>
                            ) : (
                                <>
                                    <Play className="h-4 w-4 fill-current" />
                                    Start Stack
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Service Links - shown when running */}
                {monitoringStatus?.status === 'RUNNING' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-700">
                        <a
                            href="http://localhost:3010"
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors text-sm"
                        >
                            <ExternalLink className="h-4 w-4" />
                            Grafana
                        </a>
                        <a
                            href="http://localhost:9090"
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors text-sm"
                        >
                            <ExternalLink className="h-4 w-4" />
                            Prometheus
                        </a>
                        <a
                            href="http://localhost:9093"
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors text-sm"
                        >
                            <ExternalLink className="h-4 w-4" />
                            Alertmanager
                        </a>
                        <a
                            href="http://localhost:3100/ready"
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors text-sm"
                        >
                            <ExternalLink className="h-4 w-4" />
                            Loki
                        </a>
                    </div>
                )}
            </div>
        </div >
    );
}
