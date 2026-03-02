"use client";

import { useEffect, useState } from "react";
import { Users, Plus, Shield, Clock, HardDrive, RefreshCw, AlertCircle, Wifi, Copy, Check } from "lucide-react";
import { useNetwork } from "@/context/NetworkContext";
import { ClusterManager } from "./ClusterManager";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

interface Validator {
  nodeId: string;
  stakeAmount: string;
  startTime: string; // timestamp
  endTime: string; // timestamp
  uptime: string;
  connected: boolean;
}

export function ValidatorStudio() {
  const { selectedNetwork, networks } = useNetwork();
  const [validators, setValidators] = useState<Validator[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Add Validator Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNodeId, setNewNodeId] = useState("");
  const [newWeight, setNewWeight] = useState("1");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (selectedNetwork) {
      fetchValidators();
    }
  }, [selectedNetwork]);

  const fetchValidators = async () => {
    if (!selectedNetwork) return;

    setLoading(true);
    try {
      // For primary network, use default endpoint
      // For custom networks, pass the subnetId
      const query = selectedNetwork.isPrimary ? '' : `?subnetId=${selectedNetwork.id}`;
      const res = await fetch(`${API_BASE}/validators${query}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        // Ensure data is array
        const valList = Array.isArray(data) ? data : [];
        setValidators(valList);
      }
    } catch (error) {
      console.error("Failed to fetch validators", error);
      setValidators([]);
    } finally {
      setLoading(false);
    }
  };

  const [autoFilling, setAutoFilling] = useState(false);

  const handleAutoFill = async () => {
    setAutoFilling(true);
    try {
      const res = await fetch(`${API_BASE}/validators/fetch-node-id`, { method: "POST", headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setNewNodeId(data.nodeId);
        alert(`Auto-filled from local node!\nNode ID: ${data.nodeId}`);
      } else {
        alert("Failed to fetch node info");
      }
    } catch (error) {
      console.error(error);
      alert("Error fetching node info");
    } finally {
      setAutoFilling(false);
    }
  };

  const handleAddValidator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNetwork) return;

    setAdding(true);
    try {
      const res = await fetch(`${API_BASE}/validators`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          subnetId: selectedNetwork.isPrimary ? undefined : selectedNetwork.id,
          nodeId: newNodeId,
          weight: parseInt(newWeight),
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewNodeId("");
        alert("Validator add request sent! (Simulation)");
        fetchValidators();
      } else {
        alert("Failed to add validator");
      }
    } catch (error) {
      console.error("Error adding validator", error);
    } finally {
      setAdding(false);
    }
  };

  const copyNodeId = async (nodeId: string) => {
    await navigator.clipboard.writeText(nodeId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-500" />
            Validator Studio
          </h2>
          <p className="text-slate-400">Manage network validators and staking.</p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Validator
          </button>

          <button
            onClick={fetchValidators}
            className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white hover:bg-slate-700"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Network Info Card */}
      {selectedNetwork && (
        <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-xl border border-blue-500/20 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Wifi className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{selectedNetwork.name}</h3>
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <span>Chain ID: {selectedNetwork.chainId}</span>
                  <span>•</span>
                  <span className={selectedNetwork.status === 'RUNNING' ? 'text-green-400' : 'text-yellow-400'}>
                    {selectedNetwork.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">{validators.length}</div>
              <div className="text-slate-400 text-sm">Active Validators</div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{validators.filter(v => v.connected).length}</div>
              <div className="text-slate-400 text-sm">Connected</div>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{validators.filter(v => !v.connected).length}</div>
              <div className="text-slate-400 text-sm">Offline</div>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {validators.length > 0
                  ? (validators.reduce((sum, v) => sum + parseFloat(v.uptime || '0'), 0) / validators.length * 100).toFixed(1)
                  : '0'}%
              </div>
              <div className="text-slate-400 text-sm">Avg Uptime</div>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <HardDrive className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {validators.reduce((sum, v) => sum + parseInt(v.stakeAmount || '0'), 0).toLocaleString()}
              </div>
              <div className="text-slate-400 text-sm">Total Stake</div>
            </div>
          </div>
        </div>
      </div>

      {/* Physical Nodes Management */}
      <ClusterManager />

      {/* Validators Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Validator Set</h3>
          <span className="text-sm text-slate-400">{validators.length} validators</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-950 text-slate-200 uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Node ID</th>
                <th className="px-6 py-4">Stake / Weight</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Uptime</th>
                <th className="px-6 py-4">End Time</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading && validators.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Loading validators...
                    </div>
                  </td>
                </tr>
              ) : validators.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <Shield className="h-8 w-8 text-slate-600" />
                      <span>No validators found for this network.</span>
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="mt-2 text-blue-400 hover:text-blue-300"
                      >
                        Add your first validator
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                validators.map((val) => (
                  <tr key={val.nodeId} className="hover:bg-slate-800/50 group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-white text-xs bg-slate-800 px-2 py-1 rounded">
                          {val.nodeId.substring(0, 20)}...
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white font-medium">{parseInt(val.stakeAmount).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      {val.connected ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          Connected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          Offline
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${parseFloat(val.uptime) * 100}%` }}
                          />
                        </div>
                        <span className="text-white">{(parseFloat(val.uptime) * 100).toFixed(2)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {val.endTime ? new Date(parseInt(val.endTime) * 1000).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => copyNodeId(val.nodeId)}
                        className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Copy Node ID"
                      >
                        {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Validator Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Add Validator</h3>
            <p className="text-sm text-slate-400 mb-6">
              Add a node to the validator set of <span className="text-blue-400">{selectedNetwork?.name || 'Selected Network'}</span>.
            </p>

            <form onSubmit={handleAddValidator} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Node ID (NodeID-...)</label>
                <input
                  type="text"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="NodeID-7Xhw2mDx..."
                  value={newNodeId}
                  onChange={e => setNewNodeId(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Weight / Stake Amount</label>
                <input
                  type="number"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  min="1"
                  value={newWeight}
                  onChange={e => setNewWeight(e.target.value)}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleAutoFill}
                  disabled={autoFilling}
                  className="px-4 py-2 bg-purple-600/20 text-purple-400 border border-purple-500/50 rounded-lg hover:bg-purple-600/30 transition-colors"
                >
                  {autoFilling ? 'Fetching...' : '✨ Auto Fill info'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50"
                >
                  {adding ? 'Adding...' : 'Add Validator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

