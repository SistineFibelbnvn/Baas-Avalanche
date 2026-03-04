'use client';

import { useState, useEffect } from 'react';
import { Activity, Server, Database, TrendingUp, AlertTriangle, CheckCircle, Zap, Loader2 } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { api, DashboardStats, Subnet, Validator, RecentBlock } from '@/lib/api';
import { useNetwork } from '@/context/NetworkContext';
import { QuickActionsPanel, GettingStartedGuide } from './QuickActionsPanel';

interface ComprehensiveDashboardProps {
  onCreateChain?: () => void;
  onNavigate?: (view: string) => void;
}

export function ComprehensiveDashboard({ onCreateChain, onNavigate }: ComprehensiveDashboardProps) {
  // Get selected network from context
  const { selectedNetwork } = useNetwork();

  // Live data state
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [subnets, setSubnets] = useState<Subnet[]>([]);
  const [validators, setValidators] = useState<Validator[]>([]);
  const [recentBlocks, setRecentBlocks] = useState<RecentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // TPS history for chart — accumulates real data over time
  const [tpsHistory, setTpsHistory] = useState<{ time: string; tps: number }[]>([]);

  // Fetch all data on mount or when network changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      // Use selected network's RPC URL for node stats and blocks
      const rpcUrl = selectedNetwork?.rpcUrl;

      try {
        const [stats, subnetList, validatorList, blocks] = await Promise.allSettled([
          api.node.dashboard(rpcUrl), // Pass RPC URL
          api.subnets.list(),
          api.validators.list(selectedNetwork?.isPrimary ? undefined : selectedNetwork?.subnetId),
          api.node.blocks(rpcUrl), // Pass RPC URL
        ]);

        if (stats.status === 'fulfilled') {
          setDashboardStats(stats.value);
          // Accumulate TPS history
          const currentTps = Number(stats.value?.tps) || 0;
          setTpsHistory(prev => {
            const now = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const updated = [...prev, { time: now, tps: currentTps }];
            return updated.slice(-20); // Keep last 20 data points
          });
        }
        if (subnetList.status === 'fulfilled') setSubnets(subnetList.value || []);
        if (validatorList.status === 'fulfilled') setValidators(validatorList.value || []);
        if (blocks.status === 'fulfilled') setRecentBlocks(blocks.value || []);

        // Check if all failed
        if (stats.status === 'rejected' && subnetList.status === 'rejected') {
          setError('Unable to connect to backend. Please ensure the server is running on port 4000.');
        }
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Refresh every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [selectedNetwork]); // Re-fetch when network changes

  // Computed metrics
  const networkMetrics = {
    totalBlockchains: subnets.length,
    activeNodes: dashboardStats?.peerCount || 0,
    totalValidators: validators.length,
    networkHealth: dashboardStats?.healthy ? 100 : 0,
    avgBlockTime: 2.0,
    tps: Number(dashboardStats?.tps) || 0,
    totalTransactions: dashboardStats?.blockHeight || 0,
    avgGasPrice: parseInt(dashboardStats?.gasPrice || '25'),
    blockHeight: dashboardStats?.blockHeight || 0,
  };

  // TPS chart — uses accumulated real data from polling
  const tpsData = tpsHistory.length > 0
    ? tpsHistory
    : [{ time: 'now', tps: 0 }];

  // Block time — calculate from recent blocks timestamps
  const blockTimeData = recentBlocks.length >= 2
    ? recentBlocks.slice(0, 20).map((block, i, arr) => {
      const nextBlock = arr[i + 1];
      let blockTime = 2.0;
      if (nextBlock && block.timestamp && nextBlock.timestamp) {
        const t1 = new Date(block.timestamp).getTime();
        const t2 = new Date(nextBlock.timestamp).getTime();
        if (!isNaN(t1) && !isNaN(t2)) {
          blockTime = Math.abs(t1 - t2) / 1000;
          // Cap at 60s — huge gaps are from genesis/inactive periods
          if (blockTime > 60) blockTime = 60;
        }
      }
      return { time: `#${block.height}`, blockTime: Number(blockTime.toFixed(2)), target: 2.0 };
    }).filter((_, i, arr) => i < arr.length - 1)
    : [{ time: 'N/A', blockTime: 2.0, target: 2.0 }];

  // Resource stats — not available from node API, show actual status
  const resourceData = [
    { name: 'Node Health', usage: dashboardStats?.healthy ? 100 : 0, color: dashboardStats?.healthy ? 'bg-green-500' : 'bg-red-500' },
    { name: 'Peers', usage: Math.min(100, (dashboardStats?.peerCount || 0) * 10), color: 'bg-blue-500' },
  ];

  const systemAlerts = dashboardStats?.nodeOffline
    ? [{ type: 'warning', message: 'Avalanche node is offline', time: 'Now' }]
    : [];

  const peerConnections = [
    { region: 'Local Network', peers: dashboardStats?.peerCount || 0, latency: '~5ms', status: dashboardStats?.healthy ? 'healthy' : 'degraded' },
  ];

  // Loading state
  if (loading && !dashboardStats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">BaaS Control Center</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive monitoring and management dashboard
          </p>
        </div>
        <div className="flex items-center gap-3">
          {error ? (
            <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 px-4 py-2">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Connection Error
            </Badge>
          ) : dashboardStats?.healthy ? (
            <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 px-4 py-2">
              <CheckCircle className="w-4 h-4 mr-2" />
              System Operational
            </Badge>
          ) : (
            <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20 px-4 py-2">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Node Offline
            </Badge>
          )}

        </div>
      </div>

      {/* Quick Actions */}
      <QuickActionsPanel
        onNavigate={onNavigate || (() => { })}
        onCreateChain={onCreateChain}
      />

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-lg border bg-red-500/10 border-red-500/20">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          <div className="flex-1">
            <p className="text-sm">{error}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Run: cd backend && npm run start:dev
            </p>
          </div>
        </div>
      )}

      {/* System Alerts */}
      {systemAlerts.length > 0 && (
        <div className="space-y-2">
          {systemAlerts.map((alert, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 p-4 rounded-lg border ${alert.type === 'warning'
                ? 'bg-yellow-500/10 border-yellow-500/20'
                : 'bg-blue-500/10 border-blue-500/20'
                }`}
            >
              <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${alert.type === 'warning' ? 'text-yellow-600 dark:text-yellow-400' : 'text-blue-600 dark:text-blue-400'
                }`} />
              <div className="flex-1">
                <p className="text-sm">{alert.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-blue-500" />
            <p className="text-xs text-muted-foreground">Blockchains</p>
          </div>
          <p className="text-2xl font-semibold">{networkMetrics.totalBlockchains}</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Server className="w-4 h-4 text-green-500" />
            <p className="text-xs text-muted-foreground">Peers</p>
          </div>
          <p className="text-2xl font-semibold">{networkMetrics.activeNodes}</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-purple-500" />
            <p className="text-xs text-muted-foreground">Validators</p>
          </div>
          <p className="text-2xl font-semibold">{networkMetrics.totalValidators}</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <p className="text-xs text-muted-foreground">Health</p>
          </div>
          <p className="text-2xl font-semibold">{networkMetrics.networkHealth}%</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-orange-500" />
            <p className="text-xs text-muted-foreground">TPS</p>
          </div>
          <p className="text-2xl font-semibold">{networkMetrics.tps.toLocaleString()}</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-blue-500" />
            <p className="text-xs text-muted-foreground">Block Height</p>
          </div>
          <p className="text-2xl font-semibold">{networkMetrics.blockHeight.toLocaleString()}</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-500" />
            <p className="text-xs text-muted-foreground">Version</p>
          </div>
          <p className="text-xl font-semibold">{dashboardStats?.version?.split('/')[1]?.split('-')[0] || 'N/A'}</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-green-500" />
            <p className="text-xs text-muted-foreground">Gas Price</p>
          </div>
          <p className="text-xl font-semibold">{networkMetrics.avgGasPrice.toFixed(0)} Gwei</p>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="network">Network Status</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* TPS Chart */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Transactions Per Second</h4>
                <Badge variant="outline">Real-time</Badge>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={tpsData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="time" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="tps"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.2}
                  />
                  <Area
                    type="monotone"
                    dataKey="target"
                    stroke="#22c55e"
                    strokeDasharray="5 5"
                    fill="none"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Block Time Chart */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Block Production Time</h4>
                <Badge variant="outline">Last 20 blocks</Badge>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={blockTimeData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="time" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="blockTime"
                    stroke="#a855f7"
                    strokeWidth={2}
                    dot={{ fill: '#a855f7', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        {/* Network Status Tab */}
        <TabsContent value="network" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Peer Connections */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="mb-4 font-medium">Peer Connections</h4>
              <div className="space-y-4">
                {peerConnections.map((region, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-medium">{region.region}</p>
                        <Badge className={
                          region.status === 'healthy'
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
                            : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20'
                        }>
                          {region.status}
                        </Badge>
                      </div>
                      <div className="flex gap-6 text-sm text-muted-foreground">
                        <span>{region.peers} peers</span>
                        <span>Latency: {region.latency}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Blocks */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="mb-4 font-medium">Latest Blocks</h4>
              <div className="space-y-2">
                {(recentBlocks.length > 0 ? recentBlocks : [
                  { height: networkMetrics.blockHeight, transactions: 0, timestamp: 'Now', size: '0 KB' }
                ]).slice(0, 5).map((block, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center">
                        <Database className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">#{block.height?.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{block.timestamp || 'Just now'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{block.transactions} txns</p>
                      <p className="text-xs text-muted-foreground">{block.size || 'N/A'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {resourceData.map((resource, idx) => (
              <div key={idx} className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium">{resource.name}</h4>
                  <p className="text-2xl font-semibold">{resource.usage}%</p>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${resource.color} transition-all duration-300`}
                    style={{ width: `${resource.usage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {resource.usage < 70 ? 'Normal' : resource.usage < 90 ? 'High' : 'Critical'}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="mb-4 font-medium">Node Information</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Network</span>
                  <span className="text-sm font-medium">{dashboardStats?.networkName || 'Local Network'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Version</span>
                  <span className="text-sm font-medium">{dashboardStats?.version || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Block Height</span>
                  <span className="text-sm font-medium">{networkMetrics.blockHeight.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pending Transactions</span>
                  <span className="text-sm font-medium">{dashboardStats?.pendingTxs || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="mb-4 font-medium">Subnets Overview</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Subnets</span>
                  <span className="text-sm font-medium">{subnets.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active</span>
                  <span className="text-sm font-medium text-green-600">{subnets.filter(s => s.status === 'active' || s.status === 'RUNNING').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Creating</span>
                  <span className="text-sm font-medium text-yellow-600">{subnets.filter(s => s.status === 'creating' || s.status === 'CREATING' || s.status === 'DEPLOYING').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Validators</span>
                  <span className="text-sm font-medium">{validators.length}</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-6">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium">Block Height</th>
                    <th className="text-left p-4 text-sm font-medium">Transactions</th>
                    <th className="text-left p-4 text-sm font-medium">Validator</th>
                    <th className="text-left p-4 text-sm font-medium">Size</th>
                    <th className="text-left p-4 text-sm font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {(recentBlocks.length > 0 ? recentBlocks : Array.from({ length: 5 }, (_, i) => ({
                    height: networkMetrics.blockHeight - i,
                    transactions: 0,
                    validator: 'N/A',
                    size: 'N/A',
                    timestamp: 'N/A'
                  }))).map((block, idx) => (
                    <tr key={idx} className="border-b border-border hover:bg-muted/30">
                      <td className="p-4">
                        <code className="text-sm text-blue-600 dark:text-blue-400">
                          #{block.height?.toLocaleString()}
                        </code>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">{block.transactions} txns</Badge>
                      </td>
                      <td className="p-4 text-sm">{block.validator || 'N/A'}</td>
                      <td className="p-4 text-sm text-muted-foreground">{block.size || 'N/A'}</td>
                      <td className="p-4 text-sm text-muted-foreground">{block.timestamp || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
