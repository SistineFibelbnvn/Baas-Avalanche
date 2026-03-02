'use client';

import { useState, useEffect } from 'react';
import { Activity, TrendingUp, AlertTriangle, CheckCircle, Clock, Cpu, HardDrive, Network as NetworkIcon, FileText, Loader2, RefreshCw, Play, Square } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { api, DashboardStats, Validator } from '@/lib/api';
import { useNetwork } from '@/context/NetworkContext';
import { toast } from 'sonner';

interface MonitoringStatus {
  prometheusRunning: boolean;
  grafanaRunning: boolean;
}

interface Alert {
  id: string;
  rule: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  status: 'ACTIVE' | 'RESOLVED';
  createdAt: string;
}

export function MonitoringView() {
  const { selectedNetwork } = useNetwork();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [monitoringStatus, setMonitoringStatus] = useState<MonitoringStatus | null>(null);
  const [validators, setValidators] = useState<Validator[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<Alert[]>([]);
  const [blockData, setBlockData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch all monitoring data
  const fetchData = async () => {
    try {
      const [stats, monitoring, validatorList, alertsList, blocks] = await Promise.allSettled([
        api.node.dashboard(selectedNetwork?.rpcUrl),
        api.monitoring.status(),
        api.validators.list(selectedNetwork?.subnetId),
        api.alerts.list(5),
        api.node.blocks(selectedNetwork?.rpcUrl),
      ]);

      if (stats.status === 'fulfilled') setDashboardStats(stats.value);
      if (monitoring.status === 'fulfilled') setMonitoringStatus(monitoring.value);
      if (validatorList.status === 'fulfilled') setValidators(validatorList.value || []);
      if (alertsList.status === 'fulfilled') setSystemAlerts(alertsList.value || []);
      if (blocks.status === 'fulfilled' && blocks.value?.length > 0) {
        setBlockData(blocks.value.map((b: any) => ({
          block: String(b.height),
          time: 2.0, // Avalanche target block time
          transactions: b.transactions || 0,
        })));
      }
      if (monitoring.status === 'rejected') {
        const reason = (monitoring.reason as any)?.message || 'Unknown error';
        console.error('Monitoring status failed:', monitoring.reason);
        if (stats.status === 'rejected') {
          setError(`Connection failed: ${reason}`);
        }
      } else {
        setError(null);
      }
    } catch (err) {
      console.error('Failed to fetch monitoring data:', err);
      setError(`Failed to connect: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [selectedNetwork]);

  const handleStartMonitoring = async () => {
    setActionLoading(true);
    try {
      await api.monitoring.start();
      toast.success('Monitoring Started', {
        description: 'Prometheus and Grafana are starting up...',
      });
      await fetchData();
    } catch (err) {
      toast.error('Failed to start monitoring', {
        description: (err as Error).message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStopMonitoring = async () => {
    setActionLoading(true);
    try {
      await api.monitoring.stop();
      toast.success('Monitoring Stopped', {
        description: 'Monitoring stack has been stopped.',
      });
      await fetchData();
    } catch (err) {
      toast.error('Failed to stop monitoring', {
        description: (err as Error).message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Generate chart data based on real stats
  const tpsValue = Number(dashboardStats?.tps) || 0;
  const tpsData = Array.from({ length: 20 }, (_, i) => ({
    time: `${i}:00`,
    tps: tpsValue,
    avgTps: tpsValue,
  }));

  // Dùng data thật từ api.node.blocks()
  const blockProductionData = blockData.length > 0
    ? blockData
    : Array.from({ length: 10 }, (_, i) => ({
      block: `${(dashboardStats?.blockHeight || 0) - 9 + i}`,
      time: 2.0,
      transactions: 0,
    }));

  const networkHealth = {
    status: dashboardStats?.healthy ? 'healthy' : 'offline',
    activeNodes: dashboardStats?.peerCount || 0,
    blockHeight: dashboardStats?.blockHeight || 0,
    avgBlockTime: 2.0,
    pendingTransactions: dashboardStats?.pendingTxs || 0,
  };

  // Combine real alerts with node offline status
  const nodeOfflineAlert = dashboardStats?.nodeOffline
    ? [{ type: 'warning', message: 'Avalanche node is offline', time: 'Now', severity: 'CRITICAL' }]
    : [];

  // Map backend alerts to UI format
  const displayAlerts = [
    ...nodeOfflineAlert,
    ...systemAlerts.map(a => ({
      type: a.severity === 'CRITICAL' ? 'destructive' : a.severity === 'WARNING' ? 'warning' : 'default',
      message: a.message,
      time: new Date(a.createdAt).toLocaleTimeString(),
      severity: a.severity
    }))
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Network Monitoring</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time network health and performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {monitoringStatus?.prometheusRunning ? (
            <Button
              variant="destructive"
              onClick={handleStopMonitoring}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Square className="w-4 h-4 mr-2" />}
              Stop Monitoring
            </Button>
          ) : (
            <Button onClick={handleStartMonitoring} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              Start Monitoring
            </Button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-lg border bg-red-500/10 border-red-500/20">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          <div className="flex-1">
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Monitoring Stack Status */}
      {monitoringStatus && (
        <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
          <span className="text-sm text-muted-foreground">Monitoring Stack:</span>
          <Badge className={monitoringStatus.prometheusRunning
            ? 'bg-green-500/10 text-green-600 border-green-500/20'
            : 'bg-red-500/10 text-red-600 border-red-500/20'
          }>
            Prometheus: {monitoringStatus.prometheusRunning ? 'Running' : 'Stopped'}
          </Badge>
          <Badge className={monitoringStatus.grafanaRunning
            ? 'bg-green-500/10 text-green-600 border-green-500/20'
            : 'bg-red-500/10 text-red-600 border-red-500/20'
          }>
            Grafana: {monitoringStatus.grafanaRunning ? 'Running' : 'Stopped'}
          </Badge>
          {monitoringStatus.grafanaRunning && (
            <a
              href="http://localhost:3010"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              Open Grafana Dashboard →
            </a>
          )}
          {monitoringStatus.prometheusRunning && (
            <a
              href="http://localhost:9090"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-orange-600 hover:underline ml-2"
            >
              Open Prometheus →
            </a>
          )}
        </div>
      )}

      {/* Network Health Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Network Status</p>
            {networkHealth.status === 'healthy' ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-500" />
            )}
          </div>
          <p className="text-2xl font-semibold capitalize">{networkHealth.status}</p>
          <p className={`text-xs mt-1 ${networkHealth.status === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>
            {networkHealth.status === 'healthy' ? 'All systems operational' : 'Node connection issue'}
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Connected Peers</p>
            <NetworkIcon className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-semibold">{networkHealth.activeNodes}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Active connections
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Block Height</p>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-semibold">{networkHealth.blockHeight.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Avg block time: ~{networkHealth.avgBlockTime}s
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Pending TX</p>
            <Activity className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-semibold">{networkHealth.pendingTransactions}</p>
          <p className="text-xs text-muted-foreground mt-1">
            In mempool
          </p>
        </div>
      </div>

      {/* Alerts */}
      {displayAlerts.length > 0 && (
        <div className="space-y-2">
          {displayAlerts.map((alert, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 p-4 rounded-lg border ${alert.type === 'destructive'
                ? 'bg-red-500/10 border-red-500/20'
                : alert.type === 'warning'
                  ? 'bg-yellow-500/10 border-yellow-500/20'
                  : 'bg-blue-500/10 border-blue-500/20'
                }`}
            >
              <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${alert.type === 'destructive'
                ? 'text-red-600 dark:text-red-400'
                : alert.type === 'warning'
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-blue-600 dark:text-blue-400'
                }`} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{alert.message}</p>
                  {alert.severity && (
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 ml-2">
                      {alert.severity}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Charts Tabs */}
      <Tabs defaultValue="performance" className="w-full">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="blocks">Block Production</TabsTrigger>
          <TabsTrigger value="validators">Validators</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6 mt-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="mb-4 font-medium">Transactions Per Second (TPS)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={tpsData}>
                <defs>
                  <linearGradient id="colorTps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                <Legend />
                <Area
                  type="monotone"
                  dataKey="tps"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorTps)"
                  name="Current TPS"
                />
                <Line
                  type="monotone"
                  dataKey="avgTps"
                  stroke="#10b981"
                  strokeDasharray="5 5"
                  name="Average TPS"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        {/* Block Production Tab */}
        <TabsContent value="blocks" className="mt-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="mb-4 font-medium">Block Production Time</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={blockProductionData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="block" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="time" fill="#3b82f6" name="Block Time (s)" />
                <Bar dataKey="transactions" fill="#10b981" name="Transactions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        {/* Validators Tab */}
        <TabsContent value="validators" className="mt-6">
          {validators.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Validators Yet</h3>
              <p className="text-muted-foreground">
                Validator performance data will appear here once validators are registered.
              </p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium">Node ID</th>
                      <th className="text-left p-4 text-sm font-medium">Status</th>
                      <th className="text-left p-4 text-sm font-medium">Uptime</th>
                      <th className="text-left p-4 text-sm font-medium">Stake</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validators.map((validator, idx) => (
                      <tr key={idx} className="border-t border-border hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {validator.nodeId?.slice(0, 20)}...
                          </code>
                        </td>
                        <td className="p-4">
                          <Badge className={
                            validator.status === 'active'
                              ? 'bg-green-500/10 text-green-600 border-green-500/20'
                              : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                          }>
                            {validator.status || 'pending'}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-muted h-2 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500"
                                style={{ width: `${validator.uptime || 0}%` }}
                              />
                            </div>
                            <span className="text-sm">{validator.uptime || 0}%</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm">{validator.stake || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h4 className="font-medium">CPU Usage</h4>
                  <p className="text-sm text-muted-foreground">Average load</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Requires <code className="text-xs bg-muted px-1 rounded">node-exporter</code> in monitoring stack.
                  {monitoringStatus?.prometheusRunning
                    ? ' Open Grafana for CPU metrics.'
                    : ' Start monitoring stack to enable.'}
                </p>
                {monitoringStatus?.prometheusRunning && (
                  <a href="http://localhost:3010" target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline">→ View in Grafana</a>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <HardDrive className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h4 className="font-medium">Memory Usage</h4>
                  <p className="text-sm text-muted-foreground">RAM utilization</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Requires <code className="text-xs bg-muted px-1 rounded">node-exporter</code> in monitoring stack.
                  {monitoringStatus?.prometheusRunning
                    ? ' Open Grafana for memory metrics.'
                    : ' Start monitoring stack to enable.'}
                </p>
                {monitoringStatus?.prometheusRunning && (
                  <a href="http://localhost:3010" target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline">→ View in Grafana</a>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <NetworkIcon className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h4 className="font-medium">Network I/O</h4>
                  <p className="text-sm text-muted-foreground">Connected peers</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Peers</span>
                    <span>{dashboardStats?.peerCount ?? '—'} connected</span>
                  </div>
                  <div className="bg-muted h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: `${Math.min((dashboardStats?.peerCount || 0) * 10, 100)}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {dashboardStats?.nodeOffline ? 'Node offline' : 'Live data from node'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
