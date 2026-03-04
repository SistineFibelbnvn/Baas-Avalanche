'use client';

import { useState, useEffect } from 'react';
import { Search, Blocks, Clock, FileText, TrendingUp, Copy, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
import { api, RecentBlock, DashboardStats } from '@/lib/api';
import { toast } from 'sonner';
import { useNetwork } from '@/context/NetworkContext';

export function BlockExplorerView() {
  // Get selected network from context
  const { selectedNetwork } = useNetwork();

  const [blocks, setBlocks] = useState<RecentBlock[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch data from selected network
  const fetchData = async () => {
    const rpcUrl = selectedNetwork?.rpcUrl;

    try {
      const [blocksData, statsData, txData] = await Promise.allSettled([
        api.node.blocks(rpcUrl),
        api.node.dashboard(rpcUrl),
        api.node.transactions(rpcUrl),
      ]);

      if (blocksData.status === 'fulfilled') setBlocks(blocksData.value || []);
      if (statsData.status === 'fulfilled') setStats(statsData.value);
      if (txData.status === 'fulfilled') setTransactions(txData.value || []);

      if (blocksData.status === 'rejected' && statsData.status === 'rejected') {
        setError('Failed to connect to selected network.');
      } else {
        setError(null);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to connect to selected network.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [selectedNetwork]); // Re-fetch when network changes

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'Just now';
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading block explorer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Block Explorer</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Explore blocks and transactions on your network
          </p>
        </div>
        <Button variant="outline" onClick={fetchData}>
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

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by block number, transaction hash, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button>Search</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Blocks className="w-4 h-4 text-blue-500" />
            <p className="text-sm text-muted-foreground">Latest Block</p>
          </div>
          <p className="text-2xl font-semibold">#{stats?.blockHeight?.toLocaleString() || '0'}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <p className="text-sm text-muted-foreground">TPS</p>
          </div>
          <p className="text-2xl font-semibold">{stats?.tps || 0}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-purple-500" />
            <p className="text-sm text-muted-foreground">Pending TX</p>
          </div>
          <p className="text-2xl font-semibold">{stats?.pendingTxs || 0}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-orange-500" />
            <p className="text-sm text-muted-foreground">Avg Block Time</p>
          </div>
          <p className="text-2xl font-semibold">~2.0s</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="blocks" className="w-full">
        <TabsList>
          <TabsTrigger value="blocks">
            <Blocks className="w-4 h-4 mr-2" />
            Latest Blocks
          </TabsTrigger>
          <TabsTrigger value="transactions">
            <FileText className="w-4 h-4 mr-2" />
            Transactions
          </TabsTrigger>
        </TabsList>

        {/* Blocks Tab */}
        <TabsContent value="blocks" className="mt-6">
          {blocks.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <Blocks className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Blocks Yet</h3>
              <p className="text-muted-foreground">
                Block data will appear here once the node is running.
              </p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Block</TableHead>
                    <TableHead>Hash</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blocks.map((block, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <code className="text-sm text-blue-600 dark:text-blue-400">
                          #{block.height?.toLocaleString()}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {block.hash?.slice(0, 16)}...
                          </code>
                          {block.hash && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(block.hash!)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{block.transactions} txns</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {block.size || 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatTimestamp(block.timestamp)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="mt-6">
          {transactions.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Transactions Yet</h3>
              <p className="text-muted-foreground">
                Transactions will appear here once activity starts on the network.
              </p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hash</TableHead>
                    <TableHead>Block</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Value (AVAX)</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {tx.hash?.slice(0, 16)}...
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(tx.hash)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm text-blue-600 dark:text-blue-400">
                          #{tx.block}
                        </code>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs text-muted-foreground">{tx.from?.slice(0, 8)}...</code>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs text-muted-foreground">{tx.to?.slice(0, 8)}...</code>
                      </TableCell>
                      <TableCell>
                        {tx.value}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {tx.timestamp}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
