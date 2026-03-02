"use client";

import { useEffect, useState } from "react";
import { Server, Plus, Trash2, RefreshCw, Terminal, Activity } from "lucide-react";
import api from "@/lib/api";

interface NodeInfo {
    name: string;
    uri: string;
    pid: number;
}

export function ClusterManager() {
    const [nodes, setNodes] = useState<NodeInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [newNodeName, setNewNodeName] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    const fetchStatus = async () => {
        setLoading(true);
        try {
            const info = await api.networkRunner.getStatus();
            if (info && info.nodeNames) {
                // Map names to objects (ANR status structure might vary, taking simplified approach)
                // The backend getStatus returns res.data.clusterInfo
                // We assume it has nodeNames. 
                // Actually, let's just use the raw list if possible or mock the details if only names are available.
                const nodeList = info.nodeNames.map((name: string) => ({
                    name,
                    uri: 'N/A', // URI might be in a different field
                    pid: 0
                }));
                setNodes(nodeList);
            } else {
                setNodes([]);
            }
        } catch (error) {
            console.error("Failed to fetch cluster status", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const handleAddNode = async () => {
        if (!newNodeName) return;
        setIsAdding(true);
        try {
            await api.networkRunner.addNode(newNodeName);
            setNewNodeName("");
            alert(`Node ${newNodeName} added successfully!`);
            // Wait a bit for it to spin up
            setTimeout(fetchStatus, 2000);
        } catch (e) {
            alert("Failed to add node");
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemoveNode = async (name: string) => {
        if (!confirm(`Are you sure you want to kill node ${name}?`)) return;
        try {
            await api.networkRunner.removeNode(name);
            fetchStatus();
        } catch (e) {
            alert("Failed to remove node");
        }
    };

    return (
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                        <Server className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Physical Infrastructure</h3>
                        <p className="text-sm text-slate-400">Manage local Docker nodes (Avalanche Network Runner)</p>
                    </div>
                </div>
                <button
                    onClick={fetchStatus}
                    className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {nodes.map(node => (
                        <div key={node.name} className="bg-slate-950 border border-slate-800 rounded-lg p-4 group relative hover:border-indigo-500/50 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <Terminal className="h-4 w-4 text-slate-500" />
                                    <span className="font-mono text-white font-medium">{node.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                                    <button
                                        onClick={() => handleRemoveNode(node.name)}
                                        className="text-slate-600 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Activity className="h-3 w-3" />
                                <span>Running via Docker</span>
                            </div>
                        </div>
                    ))}

                    {/* Add Node Card */}
                    <div className="bg-slate-950/50 border border-slate-800 border-dashed rounded-lg p-4 flex flex-col justify-center gap-3">
                        <input
                            type="text"
                            placeholder="New Node Name (e.g. node6)"
                            className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                            value={newNodeName}
                            onChange={(e) => setNewNodeName(e.target.value)}
                        />
                        <button
                            onClick={handleAddNode}
                            disabled={isAdding || !newNodeName}
                            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm py-1.5 rounded transition-colors disabled:opacity-50"
                        >
                            {isAdding ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                            Spawn Node
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
