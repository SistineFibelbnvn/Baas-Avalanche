'use client';

import { useState, useEffect } from 'react';
import { Network, Users, Layers, GitBranch, Copy, Loader2, AlertTriangle, RefreshCw, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api, DashboardStats } from '@/lib/api';
import { useNetwork } from '@/context/NetworkContext';
import { toast } from 'sonner';

export function NodesView() {
  const { selectedNetwork } = useNetwork();
  const [nodeStatus, setNodeStatus] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch node status
  const fetchNodeStatus = async () => {
    try {
      const data = await api.node.dashboard(selectedNetwork?.rpcUrl);
      setNodeStatus(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch node status:', err);
      setError('Failed to connect to backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNodeStatus();
    const interval = setInterval(fetchNodeStatus, 10000);
    return () => clearInterval(interval);
  }, [selectedNetwork]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const nodeStats = [
    { label: 'Status', value: nodeStatus?.healthy ? 'Running' : 'Offline', badge: nodeStatus?.healthy ? 'success' : 'error' },
    { label: 'Block Height', value: nodeStatus?.blockHeight?.toLocaleString() || '0', badge: 'default' },
    { label: 'Peers', value: nodeStatus?.peerCount?.toString() || '0', badge: 'default' },
    { label: 'Pending TX', value: nodeStatus?.pendingTxs?.toString() || '0', badge: 'default' },
  ];

  const nodeDetails = {
    'Network': nodeStatus?.networkName || 'Local Network',
    'Version': nodeStatus?.version || 'N/A',
    'Block Height': nodeStatus?.blockHeight?.toLocaleString() || 'N/A',
    'Gas Price': nodeStatus?.gasPrice ? (nodeStatus.gasPrice.includes('wei') ? nodeStatus.gasPrice : `${nodeStatus.gasPrice} Gwei`) : 'N/A',
    'Peer Count': nodeStatus?.peerCount?.toString() || 'N/A',
    'TPS': nodeStatus?.tps?.toString() || 'N/A',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading node status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Nodes</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor your Avalanche node status
          </p>
        </div>
        <Button variant="outline" onClick={fetchNodeStatus}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {nodeStats.map((stat, idx) => (
          <div key={idx} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              {stat.badge === 'success' ? (
                <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {stat.value}
                </Badge>
              ) : stat.badge === 'error' ? (
                <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
                  {stat.value}
                </Badge>
              ) : (
                <Badge variant="outline">{stat.value}</Badge>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">
            <Layers className="w-4 h-4 mr-2" />
            Details
          </TabsTrigger>
          <TabsTrigger value="peers">
            <Users className="w-4 h-4 mr-2" />
            Peers
          </TabsTrigger>
          <TabsTrigger value="network">
            <GitBranch className="w-4 h-4 mr-2" />
            Network
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="mt-6">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="p-6">
              <h3 className="mb-4 font-medium">Node Information</h3>
              <div className="space-y-4">
                {Object.entries(nodeDetails).map(([key, value]) => (
                  <div key={key} className="flex items-start justify-between py-3 border-b border-border last:border-0">
                    <span className="text-sm text-muted-foreground min-w-[140px]">{key}:</span>
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <code className="text-sm bg-muted px-2 py-1 rounded font-mono text-right break-all">
                        {value}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(String(value))}
                        className="flex-shrink-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Peers Tab */}
        <TabsContent value="peers" className="mt-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="mb-4 font-medium">Connected Peers</h3>
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {nodeStatus?.peerCount || 0} peers connected
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Detailed peer information requires P2P API access
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Network Tab */}
        <TabsContent value="network" className="mt-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="mb-4 font-medium">Network Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Network Name</p>
                <p className="font-medium">{nodeStatus?.networkName || 'Local Network'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Node Version</p>
                <p className="font-medium">{nodeStatus?.version || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Health Status</p>
                <Badge className={nodeStatus?.healthy
                  ? 'bg-green-500/10 text-green-600 border-green-500/20'
                  : 'bg-red-500/10 text-red-600 border-red-500/20'
                }>
                  {nodeStatus?.healthy ? 'Healthy' : 'Unhealthy'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">RPC Endpoint</p>
                <p className="font-medium text-sm">{selectedNetwork?.rpcUrl || 'http://localhost:9650'}</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
