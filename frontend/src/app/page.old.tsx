"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Box,
  Clock,
  Cpu,
  MoreHorizontal,
  Server,
  Users,
  Plus,
  RefreshCw,
  LogOut,
  User as UserIcon,
  ExternalLink,
  Copy,
} from "lucide-react";
import { ConsoleSidebar } from "@/components/console/ConsoleSidebar";
import { CreateSubnetModal, SubnetConfig } from "@/components/subnet/CreateSubnetModal";
import { SubnetCreatedModal } from "@/components/subnet/SubnetCreatedModal";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { ValidatorStudio } from "@/components/validators/ValidatorStudio";
import { ContractStudio } from "@/components/contracts/ContractStudio";
import { BenchmarkStudio } from "@/components/benchmark/BenchmarkStudio";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { NetworkSelector } from "@/components/network/NetworkSelector";
import { NetworkDetailsModal } from "@/components/network/NetworkDetailsModal";
import { useNetwork, Network } from "@/context/NetworkContext";

// Types
interface Subnet {
  id: string;
  name: string;
  chainId: string;
  vmType: string;
  status: string;
  network: string;
  createdAt: string;
  validators: any[];
}


export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [subnets, setSubnets] = useState<Subnet[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [recentBlocks, setRecentBlocks] = useState<any[]>([]);

  // Created subnet modals
  const [showCreatedModal, setShowCreatedModal] = useState(false);
  const [createdNetwork, setCreatedNetwork] = useState<Network | null>(null);
  const [showNetworkDetails, setShowNetworkDetails] = useState(false);

  // Use Network Context
  const { selectedNetwork, refreshNetworks } = useNetwork();

  useEffect(() => {
    fetchSubnets();
    fetchDashboardStats();
    fetchRecentBlocks();
    // Poll every 5 seconds
    const interval = setInterval(() => {
      fetchDashboardStats();
      fetchRecentBlocks();
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedNetwork]); // Re-fetch when network changes

  const fetchDashboardStats = async () => {
    if (!selectedNetwork) return;
    try {
      // Pass network RPC URL or ID to backend
      const params = new URLSearchParams();
      if (!selectedNetwork.isPrimary) {
        params.set('rpcUrl', selectedNetwork.rpcUrl);
      }
      const url = `http://localhost:4000/node/dashboard${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        setDashboardStats(await res.json());
      }
    } catch (e) { console.error("Failed to fetch dashboard stats", e); }
  }

  const fetchRecentBlocks = async () => {
    if (!selectedNetwork) return;
    try {
      const params = new URLSearchParams();
      if (!selectedNetwork.isPrimary) {
        params.set('rpcUrl', selectedNetwork.rpcUrl);
      }
      const url = `http://localhost:4000/node/blocks${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        setRecentBlocks(await res.json());
      }
    } catch (e) { console.error("Failed to fetch recent blocks", e); }
  }

  const fetchSubnets = async () => {
    try {
      const res = await fetch("http://localhost:4000/subnets");
      if (res.ok) {
        const data = await res.json();
        setSubnets(data);
      }
    } catch (error) {
      console.error("Failed to fetch subnets", error);
    }
  };

  const handleCreateSubnet = async (config: SubnetConfig) => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/subnets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: config.name,
          vmType: config.vmType,
          network: config.network,
          configMode: config.configMode,
          validatorType: config.validatorType,
          chainId: config.chainId,
          tokenSymbol: config.tokenSymbol,
          tokenSupply: config.tokenSupply,
          gasLimit: config.gasLimit,
          minBaseFee: config.minBaseFee,
          targetBlockRate: config.targetBlockRate,
          validatorManagerOwner: config.validatorManagerOwner,
          vmVersion: config.vmVersion,
          enableICM: config.enableICM,
        }),
      });
      if (res.ok) {
        const subnet = await res.json();
        // Create Network object for success modal
        const newNetwork: Network = {
          id: subnet.id,
          name: subnet.name,
          chainId: subnet.config?.chainId || config.chainId,
          rpcUrl: subnet.rpcUrl || `http://127.0.0.1:9650/ext/bc/${subnet.blockchainId || subnet.name}/rpc`,
          tokenSymbol: subnet.config?.tokenSymbol || config.tokenSymbol,
          status: subnet.status || 'CREATING',
          vmType: subnet.vmType || config.vmType,
          network: subnet.network || config.network,
          blockchainId: subnet.blockchainId,
          subnetId: subnet.subnetId,
          createdAt: subnet.createdAt || new Date().toISOString(),
          isPrimary: false,
        };
        setCreatedNetwork(newNetwork);
        setShowCreatedModal(true);
        fetchSubnets();
        refreshNetworks();
      } else {
        const error = await res.text();
        alert(`Failed to create blockchain: ${error}`);
      }
    } catch (error) {
      console.error("Error creating blockchain", error);
      alert("Error creating blockchain");
    } finally {
      setLoading(false);
    }
  };

  // Dynamic Stats Array
  const dynamicStats = [
    { name: "Total Transactions", value: dashboardStats?.totalTx || "Loading...", change: "+--%", icon: Activity },
    { name: "Active Validators", value: dashboardStats?.peerCount?.toString() || "0", change: "+0", icon: Users },
    { name: "Avg Block Time", value: dashboardStats?.avgBlockTime || "2.0s", change: "0.0s", icon: Clock },
    { name: "Block Height", value: dashboardStats?.blockHeight?.toString() || "Loading...", change: "Latest", icon: Server }, // Changed Icon from TPS/Cpu to Server
  ];

  return (
    <>
      <CreateSubnetModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateSubnet}
      />

      <SubnetCreatedModal
        network={createdNetwork}
        isOpen={showCreatedModal}
        onClose={() => setShowCreatedModal(false)}
        onViewDetails={() => {
          setShowCreatedModal(false);
          setShowNetworkDetails(true);
        }}
      />

      <NetworkDetailsModal
        network={createdNetwork}
        isOpen={showNetworkDetails}
        onClose={() => setShowNetworkDetails(false)}
        onRefresh={refreshNetworks}
      />
      <div className="flex h-screen bg-slate-950">
        {/* Sidebar */}
        <div className="w-72 shrink-0 hidden lg:block">
          <ConsoleSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900 px-8">
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-semibold text-white">Control Plane</h1>
              <NetworkSelector onCreateNew={() => setShowCreateModal(true)} />
            </div>
            <div className="flex items-center gap-4">
              {dashboardStats?.nodeOffline ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                  <span className="text-xs text-yellow-400">Node Offline</span>
                </div>
              ) : (
                <>
                  <div className={`h-2 w-2 rounded-full ${dashboardStats?.healthy ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <span className="text-sm text-slate-400">
                    {selectedNetwork?.name || 'No Network'}
                    {dashboardStats?.version ? ` (${dashboardStats.version})` : ''}
                  </span>
                </>
              )}
            </div>
          </header>

          {/* Scrollable Content */}
          <main className="flex-1 overflow-y-auto bg-slate-950 p-8">
            {activeTab === 'dashboard' && (
              <>
                {/* Top Stats */}
                <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                  {dynamicStats.map((item) => (
                    <div
                      key={item.name}
                      className="relative overflow-hidden rounded-lg bg-slate-900 px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6"
                    >
                      <dt>
                        <div className="absolute rounded-md bg-blue-500 p-3">
                          <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                        </div>
                        <p className="ml-16 truncate text-sm font-medium text-slate-400">
                          {item.name}
                        </p>
                      </dt>
                      <dd className="ml-16 flex items-baseline pb-1 sm:pb-7">
                        <p className="text-2xl font-semibold text-white">{item.value}</p>
                      </dd>
                    </div>
                  ))}
                </dl>
                {/* Charts & Tables */}
                <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
                  {/* Main Chart Area */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 lg:col-span-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold leading-6 text-white">
                        Transaction History
                      </h3>
                      <button className="text-sm text-blue-500 hover:text-blue-400">View All</button>
                    </div>
                    <div className="mt-6 h-80 w-full rounded-lg bg-slate-950/50 flex items-center justify-center border border-dashed border-slate-800">
                      <p className="text-slate-500">Chart Visualization Placeholder</p>
                    </div>
                  </div>

                  {/* Recent Blocks */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                    <h3 className="text-base font-semibold leading-6 text-white">Recent Blocks</h3>
                    <ul role="list" className="mt-6 divide-y divide-slate-800">
                      {recentBlocks.map((block) => (
                        <li key={block.height} className="flex gap-x-4 py-3 first:pt-0 last:pb-0">
                          <div className="h-10 w-10 flex-none rounded-lg bg-slate-800 flex items-center justify-center">
                            <Box className="h-5 w-5 text-slate-400" />
                          </div>
                          <div className="min-w-0 flex-auto">
                            <p className="text-sm font-semibold leading-6 text-white">
                              Block #{block.height}
                            </p>
                            <p className="mt-1 truncate text-xs leading-5 text-slate-400">
                              Validator: {block.validator}
                            </p>
                          </div>
                          <div className="hidden shrink-0 sm:flex sm:flex-col sm:items-end">
                            <p className="text-sm leading-6 text-white">{block.txs} txs</p>
                            <p className="mt-1 text-xs leading-5 text-slate-400">{block.time}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Subnet Management */}
                <div className="mt-8">
                  <div className="rounded-xl border border-slate-800 bg-slate-900">
                    <div className="flex items-center justify-between border-b border-slate-800 p-6">
                      <div className="flex items-center gap-4">
                        <h3 className="text-base font-semibold leading-6 text-white">
                          Active Subnets
                        </h3>
                        <button
                          onClick={fetchSubnets}
                          className="p-1 rounded-md hover:bg-slate-800 text-slate-400"
                          title="Refresh List"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4" />
                        {loading ? "Creating..." : "Create Subnet"}
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-slate-950/50 text-xs uppercase text-slate-200">
                          <tr>
                            <th scope="col" className="px-6 py-3">Name</th>
                            <th scope="col" className="px-6 py-3">Chain ID</th>
                            <th scope="col" className="px-6 py-3">VM Type</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3">Validators</th>
                            <th scope="col" className="px-6 py-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {subnets.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                No subnets found. Create one to get started.
                              </td>
                            </tr>
                          ) : (
                            subnets.map((subnet) => (
                              <tr key={subnet.id} className="hover:bg-slate-800/50">
                                <td className="px-6 py-4 font-medium text-white">{subnet.name}</td>
                                <td className="px-6 py-4">{subnet.chainId || "N/A"}</td>
                                <td className="px-6 py-4">{subnet.vmType}</td>
                                <td className="px-6 py-4">
                                  <span
                                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${subnet.status === "RUNNING"
                                      ? "bg-green-400/10 text-green-400 ring-green-400/20"
                                      : subnet.status === "FAILED"
                                        ? "bg-red-400/10 text-red-400 ring-red-400/20"
                                        : "bg-yellow-400/10 text-yellow-400 ring-yellow-400/20"
                                      }`}
                                  >
                                    {subnet.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4">{subnet.validators?.length || 0}</td>
                                <td className="px-6 py-4">
                                  <button className="text-slate-400 hover:text-white">
                                    <MoreHorizontal className="h-5 w-5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'monitoring' && (
              <div className="max-w-7xl mx-auto">
                <h2 className="text-2xl font-bold text-white mb-6">Real-time Monitoring</h2>
                <Dashboard />
              </div>
            )}

            {activeTab === 'validators' && (
              <div className="max-w-7xl mx-auto">
                <ValidatorStudio />
              </div>
            )}

            {activeTab === 'contracts' && (
              <div className="max-w-7xl mx-auto">
                <ContractStudio />
              </div>
            )}

            {activeTab === 'subnets' && (
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Subnet Management</h2>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    {loading ? "Creating..." : "Create Subnet"}
                  </button>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
                  <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-slate-950/50 text-xs uppercase text-slate-200">
                      <tr>
                        <th scope="col" className="px-6 py-3">Name</th>
                        <th scope="col" className="px-6 py-3">Chain ID</th>
                        <th scope="col" className="px-6 py-3">VM Type</th>
                        <th scope="col" className="px-6 py-3">Status</th>
                        <th scope="col" className="px-6 py-3">Network</th>
                        <th scope="col" className="px-6 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {subnets.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                            No subnets found. Create one to get started.
                          </td>
                        </tr>
                      ) : (
                        subnets.map((subnet) => (
                          <tr key={subnet.id} className="hover:bg-slate-800/50">
                            <td className="px-6 py-4 font-medium text-white">{subnet.name}</td>
                            <td className="px-6 py-4">{subnet.chainId || "N/A"}</td>
                            <td className="px-6 py-4">{subnet.vmType}</td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${subnet.status === "RUNNING"
                                  ? "bg-green-400/10 text-green-400 ring-green-400/20"
                                  : subnet.status === "FAILED"
                                    ? "bg-red-400/10 text-red-400 ring-red-400/20"
                                    : "bg-yellow-400/10 text-yellow-400 ring-yellow-400/20"
                                  }`}
                              >
                                {subnet.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">{subnet.network}</td>
                            <td className="px-6 py-4">
                              <button className="text-slate-400 hover:text-white">
                                <MoreHorizontal className="h-5 w-5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'benchmark' && (
              <div className="max-w-7xl mx-auto">
                <BenchmarkStudio />
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="max-w-5xl mx-auto">
                <SettingsPanel />
              </div>
            )}

            {/* Fallback for other tabs */}
            {!['dashboard', 'validators', 'monitoring', 'contracts', 'subnets', 'benchmark', 'settings'].includes(activeTab) && (
              <div className="flex h-full items-center justify-center text-slate-400">
                Feature "{activeTab}" coming soon...
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
