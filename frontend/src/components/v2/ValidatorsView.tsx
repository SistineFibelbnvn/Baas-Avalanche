'use client';

import { useState, useEffect } from 'react';
import { Shield, Plus, TrendingUp, Users, Award, AlertCircle, Loader2, RefreshCw, AlertTriangle, Trash2, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api, Validator } from '@/lib/api';
import { useNetwork } from '@/context/NetworkContext';
import { toast } from 'sonner';

export function ValidatorsView() {
  const { selectedNetwork } = useNetwork();
  // Live data state
  const [validators, setValidators] = useState<Validator[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [showAddValidator, setShowAddValidator] = useState(false);
  const [runInDocker, setRunInDocker] = useState(false);
  const [formData, setFormData] = useState({
    nodeId: '',
    stakeAmount: '',
    duration: '30',
    rewardAddress: '',
  });

  // Fetch validators
  const fetchValidators = async () => {
    try {
      const subnetId = selectedNetwork?.subnetId;
      const data = await api.validators.list(subnetId);
      setValidators(data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch validators:', err);
      setError('Failed to connect to backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchValidators();
    const interval = setInterval(fetchValidators, 30000);
    return () => clearInterval(interval);
  }, [selectedNetwork]);

  const handleAddValidator = async () => {
    if (!runInDocker && !formData.nodeId) return;

    setAdding(true);
    try {
      const res: any = await api.validators.add({
        nodeId: formData.nodeId,
        subnetId: selectedNetwork?.id,
        stake: formData.stakeAmount,
        runInDocker
      });

      if (res.status === 'ERROR') {
        throw new Error(res.message);
      }

      toast.success('Validator Added!', {
        description: `Node ${res.nodeId?.slice(0, 20)}... registered successfully.`,
      });

      await fetchValidators();
      setShowAddValidator(false);
      setFormData({
        nodeId: '',
        stakeAmount: '',
        duration: '30',
        rewardAddress: '',
      });
    } catch (err) {
      console.error('Add validator error:', err);
      toast.error('Failed to add validator', {
        description: (err as Error).message,
      });
    } finally {
      setAdding(false);
    }
  };

  const networkStats = {
    totalValidators: validators.length,
    activeValidators: validators.filter(v => v.status === 'active').length,
    totalStaked: validators.reduce((acc, v) => acc + parseFloat(v.stake || '0'), 0).toFixed(2),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading validators...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Validators</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your network validators and staking
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchValidators}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddValidator(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Validator
          </Button>
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

      {/* Network Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">Total Validators</p>
              <h3 className="text-2xl font-semibold mb-2">{networkStats.totalValidators}</h3>
              <p className="text-xs text-green-600 dark:text-green-400">
                {networkStats.activeValidators} active
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">Total Staked</p>
              <h3 className="text-2xl font-semibold mb-2">{networkStats.totalStaked} AVAX</h3>
              <p className="text-xs text-muted-foreground">
                Across all validators
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">Pending Validators</p>
              <h3 className="text-2xl font-semibold mb-2">
                {validators.filter(v => v.status === 'pending').length}
              </h3>
              <p className="text-xs text-muted-foreground">
                Awaiting activation
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            <strong>Note:</strong> Validator management requires a running Avalanche node. Operations are processed through the backend API.
          </p>
        </div>
      </div>

      {/* Validators Table */}
      {validators.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No Validators Yet</h3>
          <p className="text-muted-foreground mb-4">
            Add your first validator to secure the network.
          </p>
          <Button onClick={() => setShowAddValidator(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Validator
          </Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="font-medium">Active Validators</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Node ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stake</TableHead>
                  <TableHead>Uptime</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {validators.map((validator, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-muted-foreground">
                          {validator.nodeId?.slice(0, 20)}...
                        </code>
                        <button
                          onClick={() => {
                            if (validator.nodeId) {
                              navigator.clipboard.writeText(validator.nodeId);
                              toast.success('Node ID copied!');
                            }
                          }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        validator.status === 'active'
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
                          : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20'
                      }>
                        {validator.status || 'pending'}
                      </Badge>
                    </TableCell>
                    <TableCell>{validator.stake || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-muted h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${Math.min(validator.uptime || 0, 100) >= 99.5 ? 'bg-green-500' :
                              Math.min(validator.uptime || 0, 100) >= 98 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                            style={{ width: `${Math.min(validator.uptime || 0, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm">{Math.min(validator.uptime || 0, 100).toFixed(2)}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {validator.startTime
                        ? (isNaN(Number(validator.startTime))
                          ? new Date(validator.startTime).toLocaleDateString()
                          : new Date(Number(validator.startTime) * 1000).toLocaleDateString())
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {validator.endTime
                        ? (isNaN(Number(validator.endTime))
                          ? new Date(validator.endTime).toLocaleDateString()
                          : new Date(Number(validator.endTime) * 1000).toLocaleDateString())
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-500/10"
                        title="Remove Validator (Stop Node)"
                        onClick={async () => {
                          if (confirm('Are you sure you want to remove this validator? If it is a docker node, it will be stopped.')) {
                            try {
                              await api.validators.remove(validator.nodeId);
                              toast.success('Validator removed');
                              fetchValidators();
                            } catch (e: any) {
                              toast.error('Failed to remove: ' + e.message);
                            }
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Add Validator Dialog */}
      <Dialog open={showAddValidator} onOpenChange={setShowAddValidator}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Validator</DialogTitle>
            <DialogDescription>
              Register a new validator node to participate in consensus
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div>
              <div className="flex items-center space-x-2 border p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 mb-4">
                <input
                  type="checkbox"
                  id="runInDocker"
                  checked={runInDocker}
                  onChange={(e) => setRunInDocker(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <Label htmlFor="runInDocker" className="flex items-center gap-2 font-medium cursor-pointer">
                    <Box className="w-4 h-4" />
                    Run Node in Docker
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Automatically spin up a new AvalancheGo node container
                  </p>
                </div>
              </div>

              {!runInDocker && (
                <>
                  <Label htmlFor="nodeId">Node ID *</Label>
                  <Input
                    id="nodeId"
                    value={formData.nodeId}
                    onChange={(e) => setFormData({ ...formData, nodeId: e.target.value })}
                    placeholder="NodeID-..."
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    The unique identifier for your validator node
                  </p>
                </>
              )}
            </div>

            <div>
              <Label htmlFor="stakeAmount">Stake Amount (AVAX)</Label>
              <Input
                id="stakeAmount"
                type="number"
                value={formData.stakeAmount}
                onChange={(e) => setFormData({ ...formData, stakeAmount: e.target.value })}
                placeholder="2000"
                min="2000"
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum: 2,000 AVAX for mainnet
              </p>
            </div>

            <div>
              <Label htmlFor="rewardAddress">Reward Address</Label>
              <Input
                id="rewardAddress"
                value={formData.rewardAddress}
                onChange={(e) => setFormData({ ...formData, rewardAddress: e.target.value })}
                placeholder="0x..."
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Address to receive staking rewards
              </p>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                ⚠️ <strong>Important:</strong> Make sure your node is running and synchronized before adding it as a validator.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAddValidator(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddValidator} disabled={adding || (!runInDocker && !formData.nodeId)}>
              {adding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Add Validator
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
