import { useState, useEffect } from 'react';
import { Activity, Users, Clock, Database, Plus, Settings2, Zap, GitBranch, Box, RefreshCw, Link2, FileCheck } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { ToolCard } from './ToolCard';
import { Button } from '@/components/ui/button';
import { ExecutionLogs } from './ExecutionLogs';
import { ChainsManagement } from './ChainsManagement';
import { api, DashboardStats } from '@/lib/api';
import { useNetworkRpc, useNetwork } from '@/context/NetworkContext';

interface DashboardViewProps {
  loading?: boolean;
  onCreateChain?: () => void;
}

export function DashboardView({ loading = false, onCreateChain }: DashboardViewProps) {
  const rpcUrl = useNetworkRpc();
  const { selectedNetwork } = useNetwork();

  const [stats, setStats] = useState<DashboardStats>({
    healthy: false,
    blockHeight: 0,
    peerCount: 0,
    pendingTxs: 0,
    gasPrice: '0',
    tps: 0
  });

  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = async () => {
    if (!rpcUrl) return;
    setIsRefreshing(true);
    try {
      // If we are on C-Chain, utilize the real endpoint, otherwise try to fetch from subnet
      const data = await api.node.dashboard(rpcUrl);
      setStats(data || { healthy: false });
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch dashboard stats', error);
      // Fallback or maintain last known state but mark unhealthy
      setStats(prev => ({ ...prev, healthy: false }));
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000); // 5s poll
    return () => clearInterval(interval);
  }, [rpcUrl]);

  const metrics = [
    {
      title: 'Total Transactions',
      value: stats.pendingTxs?.toLocaleString() || '0', // Placeholder as total txs might not be available in simple dashboard api
      icon: Activity,
      trend: { value: `${stats.tps || 0} TPS`, isPositive: true },
      iconColor: 'bg-blue-500'
    },
    {
      title: 'Peers',
      value: stats.peerCount?.toString() || '0',
      icon: Users,
      trend: { value: 'Connected', isPositive: stats.healthy },
      iconColor: 'bg-green-500'
    },
    {
      title: 'Gas Price',
      value: `${parseInt(stats.gasPrice || '25', 10)} Gwei`,
      icon: Clock,
      iconColor: 'bg-purple-500'
    },
    {
      title: 'Block Height',
      value: stats.blockHeight?.toLocaleString() || '0',
      icon: Database,
      trend: { value: selectedNetwork?.name || 'Network', isPositive: true },
      iconColor: 'bg-orange-500'
    }
  ];

  const tools = [
    {
      title: 'Create Chain',
      description: 'Launch your custom L1 blockchain',
      icon: Plus,
      action: 'create-chain'
    },
    {
      title: 'Add L1 Validator',
      description: 'Add validators to your L1 network',
      icon: Users
    },
    {
      title: 'Deploy Teleporter',
      description: 'Set up cross-chain messaging',
      icon: Link2
    },
    {
      title: 'Deploy Proxy Contract',
      description: 'Set up upgradeable contracts',
      icon: Settings2
    },
    {
      title: 'Deploy Validator Manager',
      description: 'Manage L1 validator sets',
      icon: FileCheck
    },
    {
      title: 'Initialize Validator Set',
      description: 'Configure initial validators',
      icon: Zap
    },
    {
      title: 'Cross-Chain Transfer',
      description: 'Transfer AVAX between P-Chain and C-Chain',
      icon: GitBranch
    },
    {
      title: 'RPC Methods Check',
      description: 'Verify node RPC endpoint functionality',
      icon: RefreshCw
    },
    {
      title: 'L1 Node Setup with Docker',
      description: 'Set up node infrastructure with Docker',
      icon: Box
    }
  ];

  const handleToolClick = (action?: string) => {
    if (action === 'create-chain' && onCreateChain) {
      onCreateChain();
    } else {
      console.log('Tool clicked');
    }
  };

  return (
    <div className="space-y-8">
      {/* Metrics Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2>Network Overview</h2>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              RPC: {rpcUrl}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchStats} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, idx) => (
            <MetricCard
              key={idx}
              {...metric}
              loading={loading || isRefreshing && !stats.blockHeight}
            />
          ))}
        </div>
      </div>

      {/* Chains Management */}
      <ChainsManagement onCreateNew={onCreateChain || (() => { })} />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tools Grid */}
        <div className="space-y-4">
          <div>
            <h3>Quick Actions</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Common blockchain operations
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {tools.slice(0, 6).map((tool, idx) => (
              <ToolCard
                key={idx}
                {...tool}
                onClick={() => handleToolClick(tool.action)}
              />
            ))}
          </div>
        </div>

        {/* Execution Logs */}
        <div className="space-y-4">
          <div>
            <h3>System Activity</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Live execution logs and events
            </p>
          </div>
          <ExecutionLogs />
        </div>
      </div>
    </div>
  );
}
