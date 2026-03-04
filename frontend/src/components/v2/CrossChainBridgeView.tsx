import { useState, useEffect } from 'react';
import { ArrowRightLeft, Send, History, Zap, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface TransferHistory {
  id: string;
  fromChain: string;
  toChain: string;
  amount: string;
  status: string;
  timestamp: string;
  txHash: string;
}

export function CrossChainBridgeView() {
  const [bridgeData, setBridgeData] = useState({
    fromChain: 'c-chain',
    toChain: 'subnet-1',
    amount: '',
    recipient: '',
    token: 'AVAX',
  });
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<TransferHistory[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Chains list could also be fetched from API in future
  const chains = [
    { id: 'p-chain', name: 'P-Chain', type: 'primary' },
    { id: 'c-chain', name: 'C-Chain', type: 'primary' },
    { id: 'x-chain', name: 'X-Chain', type: 'primary' },
    { id: 'subnet-1', name: 'DeFi Subnet', type: 'subnet' },
    { id: 'subnet-2', name: 'Gaming Subnet', type: 'subnet' },
  ];

  const fetchHistory = async () => {
    try {
      const data = await api.bridge.history();
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch bridge history', err);
    }
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 10000); // Poll for status updates
    return () => clearInterval(interval);
  }, []);

  const handleBridge = async () => {
    setLoading(true);
    try {
      const result = await api.bridge.transfer(bridgeData);
      toast.success('Bridge Transfer Initiated', {
        description: `Tx Hash: ${result.txHash.substring(0, 10)}...`,
      });
      await fetchHistory();
      setBridgeData(prev => ({ ...prev, amount: '' })); // Reset amount
    } catch (err) {
      toast.error('Bridge Transfer Failed', {
        description: 'Could not initiate transfer. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return (
          <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
      case 'pending':
      case 'in-transit':
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20">
            <Clock className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
            <AlertCircle className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2>Cross-Chain Bridge</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Transfer assets between Avalanche chains and subnets using Avalanche Warp Messaging (AWM)
        </p>
      </div>

      {/* Stats - Calculate from history */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowRightLeft className="w-4 h-4 text-blue-500" />
            <p className="text-sm text-muted-foreground">Total Transfers</p>
          </div>
          <p className="text-2xl">{history.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-purple-500" />
            <p className="text-sm text-muted-foreground">Pending</p>
          </div>
          <p className="text-2xl">{history.filter(h => h.status === 'pending').length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <p className="text-sm text-muted-foreground">Completed</p>
          </div>
          <p className="text-2xl">{history.filter(h => h.status === 'completed').length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-orange-500" />
            <p className="text-sm text-muted-foreground">Avg Time</p>
          </div>
          <p className="text-2xl">~5s</p>
        </div>
      </div>

      <Tabs defaultValue="bridge" className="w-full">
        <TabsList>
          <TabsTrigger value="bridge">
            <ArrowRightLeft className="w-4 h-4 mr-2" />
            Bridge Assets
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Bridge Assets Tab */}
        <TabsContent value="bridge" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bridge Form */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="mb-6">Transfer Assets</h3>

              <div className="space-y-6">
                {/* From Chain */}
                <div>
                  <Label>From Chain</Label>
                  <Select
                    value={bridgeData.fromChain}
                    onValueChange={(value) => setBridgeData({ ...bridgeData, fromChain: value })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {chains.map((chain) => (
                        <SelectItem key={chain.id} value={chain.id}>
                          {chain.name} {chain.type === 'primary' && '(Primary Network)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Swap Button */}
                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setBridgeData({
                      ...bridgeData,
                      fromChain: bridgeData.toChain,
                      toChain: bridgeData.fromChain,
                    })}
                  >
                    <ArrowRightLeft className="w-5 h-5" />
                  </Button>
                </div>

                {/* To Chain */}
                <div>
                  <Label>To Chain</Label>
                  <Select
                    value={bridgeData.toChain}
                    onValueChange={(value) => setBridgeData({ ...bridgeData, toChain: value })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {chains.map((chain) => (
                        <SelectItem key={chain.id} value={chain.id}>
                          {chain.name} {chain.type === 'primary' && '(Primary Network)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Token Selection */}
                <div>
                  <Label>Token</Label>
                  <Select
                    value={bridgeData.token}
                    onValueChange={(value) => setBridgeData({ ...bridgeData, token: value })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AVAX">AVAX</SelectItem>
                      <SelectItem value="DEFI">DEFI Token</SelectItem>
                      <SelectItem value="USDC">USDC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount */}
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={bridgeData.amount}
                    onChange={(e) => setBridgeData({ ...bridgeData, amount: e.target.value })}
                    placeholder="0.00"
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Balance: 125.50 {bridgeData.token} (Simulated)
                  </p>
                </div>

                <Button className="w-full" onClick={handleBridge} disabled={!bridgeData.amount || loading}>
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  {loading ? 'Bridging...' : `Bridge ${bridgeData.token}`}
                </Button>
              </div>
            </div>

            {/* Info Panel - Keeping partial static content as it's educational */}
            <div className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <Zap className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="mb-2">Avalanche Warp Messaging (AWM)</h4>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mb-3">
                      Native cross-subnet communication protocol powered by BLS multi-signatures.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="p-6 border-b border-border">
              <h3>Transfer History</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 text-sm">From</th>
                    <th className="text-left p-4 text-sm">To</th>
                    <th className="text-left p-4 text-sm">Amount</th>
                    <th className="text-left p-4 text-sm">Status</th>
                    <th className="text-left p-4 text-sm">Transaction Hash</th>
                    <th className="text-left p-4 text-sm">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No transfers yet. Bridge some assets to see history here.
                      </td>
                    </tr>
                  ) : (
                    history.map((transfer) => (
                      <tr key={transfer.id} className="border-t border-border hover:bg-muted/30">
                        <td className="p-4 text-sm">{transfer.fromChain}</td>
                        <td className="p-4 text-sm">{transfer.toChain}</td>
                        <td className="p-4 text-sm font-mono">{transfer.amount}</td>
                        <td className="p-4">{getStatusBadge(transfer.status)}</td>
                        <td className="p-4">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {transfer.txHash.substring(0, 10)}...
                          </code>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {new Date(transfer.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
