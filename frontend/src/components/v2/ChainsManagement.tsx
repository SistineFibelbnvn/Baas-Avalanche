'use client';

import { useState, useEffect } from 'react';
import { Plus, Play, Square, Trash2, Settings, Copy, MoreVertical, Power, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { api, Subnet } from '@/lib/api';
import { toast } from 'sonner';

interface Chain {
  id: string;
  name: string;
  chainId: string;
  status: 'running' | 'stopped' | 'starting' | 'stopping';
  type: 'mainnet' | 'testnet' | 'local';
  vmType: 'evm' | 'wasm';
  blockHeight: number;
  validators: number;
  createdAt: string;
  rpcUrl: string;
  blockchainId?: string;
}

interface ChainsManagementProps {
  onCreateNew: () => void;
}

// Map subnet status to chain status
function mapStatus(status: string): Chain['status'] {
  const statusMap: Record<string, Chain['status']> = {
    'RUNNING': 'running',
    'active': 'running',
    'CREATING': 'starting',
    'DEPLOYING': 'starting',
    'creating': 'starting',
    'pending': 'starting',
    'DRAFT': 'stopped',
    'FAILED': 'stopped',
    'failed': 'stopped',
  };
  return statusMap[status] || 'stopped';
}

export function ChainsManagement({ onCreateNew }: ChainsManagementProps) {
  const [chains, setChains] = useState<Chain[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteChain, setDeleteChain] = useState<Chain | null>(null);

  // Fetch chains from API
  const fetchChains = async () => {
    try {
      const subnets = await api.subnets.list();
      const mappedChains: Chain[] = subnets.map((subnet: Subnet) => ({
        id: subnet.id,
        name: subnet.name,
        chainId: subnet.chainId?.toString() || 'N/A',
        status: mapStatus(subnet.status),
        type: 'local' as const,
        vmType: 'evm' as const,
        blockHeight: 0, // Would need separate API call
        validators: subnet.validators || 0,
        createdAt: subnet.createdAt ? new Date(subnet.createdAt).toLocaleDateString() : 'N/A',
        rpcUrl: subnet.rpcUrl || '',
        blockchainId: subnet.blockchainId,
      }));
      setChains(mappedChains);
    } catch (error) {
      console.error('Failed to fetch chains:', error);
      toast.error('Failed to load chains');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChains();
    const interval = setInterval(fetchChains, 10000);
    return () => clearInterval(interval);
  }, []);

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleStart = async (chainId: string) => {
    setActionLoading(chainId);
    try {
      await api.subnets.start(chainId);
      toast.success('Starting blockchain...', {
        description: 'This process may take a few seconds.',
      });
      await fetchChains();
    } catch (error) {
      toast.error('Failed to start blockchain', {
        description: (error as Error).message,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleStop = async (chainId: string) => {
    setActionLoading(chainId);
    try {
      await api.subnets.stop(chainId);
      toast.success('Blockchain stopped', {
        description: 'Blockchain has been stopped successfully.',
      });
      await fetchChains();
    } catch (error) {
      toast.error('Failed to stop blockchain', {
        description: (error as Error).message,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestart = async (chainId: string) => {
    setActionLoading(chainId);
    try {
      await api.subnets.stop(chainId);
      await api.subnets.start(chainId);
      toast.success('Blockchain restarted');
      await fetchChains();
    } catch (error) {
      toast.error('Failed to restart blockchain', {
        description: (error as Error).message,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = (chain: Chain) => {
    setDeleteChain(chain);
  };

  const confirmDelete = async () => {
    if (deleteChain) {
      setActionLoading(deleteChain.id);
      try {
        await api.subnets.delete(deleteChain.id);
        toast.success('Blockchain deleted', {
          description: `${deleteChain.name} has been deleted successfully.`,
        });
        setDeleteChain(null);
        await fetchChains();
      } catch (error) {
        toast.error('Failed to delete blockchain', {
          description: (error as Error).message,
        });
      } finally {
        setActionLoading(null);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const getStatusColor = (status: Chain['status']) => {
    switch (status) {
      case 'running':
        return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
      case 'stopped':
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20';
      case 'starting':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';
      case 'stopping':
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20';
    }
  };

  const getTypeColor = (type: Chain['type']) => {
    switch (type) {
      case 'mainnet':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'testnet':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'local':
        return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Blockchain Chains</h3>
          <p className="text-sm text-muted-foreground">Manage your deployed blockchains</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchChains}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={onCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            Create New
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {chains.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <p className="text-muted-foreground mb-4">No chains deployed yet</p>
          <Button onClick={onCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Chain
          </Button>
        </div>
      ) : (
        /* Chains List */
        <div className="grid gap-4">
          {chains.map((chain) => (
            <div
              key={chain.id}
              className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-3 h-3 rounded-full ${chain.status === 'running' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{chain.name}</h4>
                      <Badge className={getStatusColor(chain.status)}>{chain.status}</Badge>
                      <Badge className={getTypeColor(chain.type)}>{chain.type}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Chain ID: {chain.chainId}</span>
                      <span>Validators: {chain.validators}</span>
                      <span>Created: {chain.createdAt}</span>
                    </div>
                  </div>
                </div>

                {/* RPC URL with Copy */}
                <div className="flex items-center gap-2 mr-4">
                  {chain.rpcUrl && (
                    <div className="flex items-center gap-2 bg-muted px-3 py-1 rounded text-xs">
                      <code className="max-w-[200px] truncate">{chain.rpcUrl}</code>
                      <button
                        onClick={() => copyToClipboard(chain.rpcUrl)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={actionLoading === chain.id}
                    onClick={() => chain.status === 'running' ? handleStop(chain.id) : handleStart(chain.id)}
                  >
                    {actionLoading === chain.id ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Loading...
                      </>
                    ) : chain.status === 'running' ? (
                      <>
                        <Square className="w-3 h-3 mr-1" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 mr-1" />
                        Start
                      </>
                    )}
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleRestart(chain.id)}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Restart
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="w-4 h-4 mr-2" />
                        Configure
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDelete(chain)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteChain} onOpenChange={() => setDeleteChain(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chain</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteChain?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
