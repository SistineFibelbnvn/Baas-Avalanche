'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Network, Plus, Settings, Users, Zap, Lock, Globe, TrendingUp, Shield, GitBranch,
  Loader2, AlertTriangle, RefreshCw, ExternalLink, Copy, X, Sparkles, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/components/ui/utils';
import { api, Subnet } from '@/lib/api';
import { toast } from 'sonner';
import { useNetwork } from '@/context/NetworkContext';
import { EnhancedSubnetWizard } from './EnhancedSubnetWizard';
import { SimpleSubnetWizard } from './SimpleSubnetWizard';

export function SubnetManagementView() {
  // Auth context
  const { token, isLoading: authLoading } = useAuth();
  // Network context
  const { selectNetwork, networks } = useNetwork();

  // Live data state
  const [subnets, setSubnets] = useState<Subnet[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detail view state
  const [selectedSubnet, setSelectedSubnet] = useState<Subnet | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Advanced wizard state
  const [showAdvancedWizard, setShowAdvancedWizard] = useState(false);

  // Fetch subnets
  const fetchSubnets = async () => {
    try {
      const data = await api.subnets.list();
      setSubnets(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch subnets:', err);
      const msg = err?.message || '';
      if (msg.includes('401') || msg.includes('Unauthorized')) {
        setError('Session expired. Please sign in again.');
      } else {
        setError('Failed to connect to backend. Ensure server is running on port 4000.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Chờ auth load xong và có token mới fetch — tránh flash 401
  useEffect(() => {
    if (authLoading) return;          // Chưa đọc xong localStorage
    if (!token) {                      // Chưa đăng nhập
      setLoading(false);
      setError('Please sign in to view your blockchains.');
      return;
    }
    fetchSubnets();
    const interval = setInterval(fetchSubnets, 15000);
    return () => clearInterval(interval);
  }, [authLoading, token]);            // Re-fetch khi token thay đổi (vd: sau Google login)

  const addNetworkToWallet = async (subnet: Subnet) => {
    if (!subnet.rpcUrl || !subnet.chainId) return;

    const { ethereum } = window as any;
    if (!ethereum) {
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    try {
      // Request access first (wakes up wallet)
      await ethereum.request({ method: 'eth_requestAccounts' });
    } catch (err: any) {
      console.error('User denied account access');
      return;
    }

    const chainIdHex = `0x${Number(subnet.chainId).toString(16)}`;

    try {
      // 1. Try to switch first
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
      toast.success(`Switched to ${subnet.name}`);
    } catch (switchError: any) {
      // 2. If chain not found (4902), add it
      // Note: MetaMask error codes can be nested
      if (switchError.code === 4902 ||
        switchError.data?.originalError?.code === 4902 ||
        switchError.code === -32603 || // Sometimes returns internal error for missing chain
        switchError.message?.includes('Unrecognized chain ID')) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: chainIdHex,
                chainName: subnet.name,
                rpcUrls: [subnet.rpcUrl],
                nativeCurrency: {
                  name: subnet.tokenSymbol || 'AVAX',
                  symbol: subnet.tokenSymbol || 'AVAX',
                  decimals: 18,
                },
              },
            ],
          });
          toast.success('Network add request sent to wallet');
        } catch (addError: any) {
          console.error('Add chain error:', addError);
          if (addError.code === -32602) {
            toast.error('Network mismatch', {
              description: 'This Chain ID exists in your wallet with a different Symbol/Config. Please delete the network from your wallet and try again.'
            });
          } else {
            toast.error('Failed to add network', { description: addError.message });
          }
        }
      } else {
        console.error('Switch chain error:', switchError);
        toast.error('Failed to switch network', { description: switchError.message });
      }
    }
  };



  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s === 'running' || s === 'active') {
      return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
    }
    if (s === 'creating') {
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    }
    if (s === 'deploying') {
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    }
    if (s === 'failed') {
      return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
    }
    return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20';
  };



  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading subnets...</p>
        </div>
      </div>
    );
  }



  return (
    <div className="space-y-6">
      <EnhancedSubnetWizard
        open={showAdvancedWizard}
        onOpenChange={setShowAdvancedWizard}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Subnet Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage Avalanche Subnets (L1 blockchains)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSubnets}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <SimpleSubnetWizard
            onComplete={fetchSubnets}
            onAdvanced={() => setShowAdvancedWizard(true)}
          />
        </div>
      </div>

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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Network className="w-4 h-4 text-blue-500" />
            <p className="text-sm text-muted-foreground">Total Subnets</p>
          </div>
          <p className="text-2xl font-semibold">{subnets.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-green-500" />
            <p className="text-sm text-muted-foreground">Total Validators</p>
          </div>
          <p className="text-2xl font-semibold">{subnets.reduce((acc, s) => acc + (s.validators || 0), 0)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <GitBranch className="w-4 h-4 text-purple-500" />
            <p className="text-sm text-muted-foreground">VM Types</p>
          </div>
          <p className="text-2xl font-semibold">{new Set(subnets.map(s => s.vmType)).size}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-orange-500" />
            <p className="text-sm text-muted-foreground">Active Subnets</p>
          </div>
          <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
            {subnets.filter(s => s.status === 'active').length}
          </p>
        </div>
      </div>

      {/* Subnets Grid */}
      {subnets.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <Network className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No Blockchains Yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first Layer 1 Blockchain to get started.
          </p>

        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {subnets.map((subnet) => (
            <div
              key={subnet.id}
              className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold">{subnet.name}</h4>
                    <Badge className={getStatusBadge(subnet.status)}>
                      {subnet.status?.toUpperCase()}
                    </Badge>
                  </div>
                  {subnet.subnetId && (
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {subnet.subnetId}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(subnet.subnetId!);
                          toast.success('Subnet ID copied!');
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">VM Type</p>
                  <p className="text-sm font-medium">{subnet.vmType}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Chain ID</p>
                  <p className="text-sm font-medium">{subnet.chainId || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">RPC URL</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded flex-1 break-all">
                      {subnet.rpcUrl || 'Pending...'}
                    </code>
                    {subnet.rpcUrl && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(subnet.rpcUrl!);
                          toast.success('RPC URL copied!');
                        }}
                        className="text-muted-foreground hover:text-foreground flex-shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created</p>
                  <p className="text-sm font-medium">
                    {subnet.createdAt ? new Date(subnet.createdAt).toLocaleDateString() : 'Just now'}
                  </p>
                </div>
                {subnet.blockchainId && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Blockchain ID</p>
                    <div className="flex items-center gap-1">
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {subnet.blockchainId.slice(0, 12)}...
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(subnet.blockchainId!);
                          toast.success('Blockchain ID copied!');
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setSelectedSubnet(subnet);
                    setShowDetails(true);
                  }}
                >
                  <Settings className="w-3 h-3 mr-2" />
                  Configure
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    const networkMatch = networks.find(n => n.id === subnet.id);
                    if (networkMatch) {
                      selectNetwork(networkMatch);
                      toast.success(`Switched to ${subnet.name}`, {
                        description: 'You can now view validators for this network',
                      });
                    }
                  }}
                >
                  <Users className="w-3 h-3 mr-2" />
                  Validators
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-none text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/20"
                  onClick={async () => {
                    if (confirm(`Are you sure you want to delete subnet ${subnet.name}? This cannot be undone.`)) {
                      try {
                        await api.subnets.delete(subnet.id);
                        toast.success('Subnet deleted');
                        fetchSubnets();
                      } catch (err) {
                        console.error(err);
                        toast.error('Failed to delete subnet');
                      }
                    }
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Subnet Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedSubnet?.name}
              <Badge className={getStatusBadge(selectedSubnet?.status || 'pending')}>
                {selectedSubnet?.status?.toUpperCase()}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Blockchain configuration and connection details
            </DialogDescription>
          </DialogHeader>

          {selectedSubnet && (
            <div className="space-y-4 mt-4">
              {/* Connection Info */}
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Network className="w-4 h-4" />
                  Connection Details
                </h4>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">RPC URL</span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-background px-2 py-1 rounded max-w-[350px] truncate">
                        {selectedSubnet.rpcUrl || 'N/A'}
                      </code>
                      {selectedSubnet.rpcUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedSubnet.rpcUrl!);
                            toast.success('RPC URL copied!');
                          }}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Chain ID</span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-background px-2 py-1 rounded">
                        {selectedSubnet.chainId || 'N/A'}
                      </code>
                      {selectedSubnet.chainId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(String(selectedSubnet.chainId));
                            toast.success('Chain ID copied!');
                          }}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Blockchain ID</span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-background px-2 py-1 rounded">
                        {selectedSubnet.blockchainId || 'N/A'}
                      </code>
                      {selectedSubnet.blockchainId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedSubnet.blockchainId!);
                            toast.success('Blockchain ID copied!');
                          }}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Subnet ID</span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-background px-2 py-1 rounded">
                        {selectedSubnet.subnetId || selectedSubnet.id}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedSubnet.subnetId || selectedSubnet.id);
                          toast.success('Subnet ID copied!');
                        }}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  onClick={() => {
                    const networkMatch = networks.find(n => n.id === selectedSubnet.id);
                    if (networkMatch) {
                      selectNetwork(networkMatch);
                      setShowDetails(false);
                      toast.success(`Switched to ${selectedSubnet.name}`);
                    }
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Use This Network
                </Button>
                {selectedSubnet.rpcUrl && (
                  <Button
                    variant="outline"
                    onClick={() => addNetworkToWallet(selectedSubnet)}
                  >
                    Add to Wallet
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>


    </div>
  );
}
