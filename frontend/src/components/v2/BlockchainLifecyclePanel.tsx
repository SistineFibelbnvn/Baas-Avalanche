import { useState } from 'react';
import { Play, Square, RotateCw, Trash2, Settings, Activity, CheckCircle, Clock, XCircle, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/components/ui/utils';

interface Blockchain {
  id: string;
  name: string;
  type: 'subnet' | 'primary';
  state: 'running' | 'stopped' | 'starting' | 'stopping' | 'error' | 'syncing';
  chainId: string;
  blockHeight: number;
  validators: number;
  uptime: number;
  syncProgress?: number;
  lastActivity: string;
  cpu: number;
  memory: number;
  network: number;
}

export function BlockchainLifecyclePanel() {
  const [blockchains, setBlockchains] = useState<Blockchain[]>([
    {
      id: '1',
      name: 'DeFi Production Chain',
      type: 'subnet',
      state: 'running',
      chainId: '43214',
      blockHeight: 156234,
      validators: 12,
      uptime: 99.8,
      lastActivity: '2 sec ago',
      cpu: 45,
      memory: 62,
      network: 78,
    },
    {
      id: '2',
      name: 'Gaming TestNet',
      type: 'subnet',
      state: 'running',
      chainId: '99999',
      blockHeight: 89456,
      validators: 8,
      uptime: 98.5,
      lastActivity: '1 sec ago',
      cpu: 38,
      memory: 54,
      network: 65,
    },
    {
      id: '3',
      name: 'Dev Staging Chain',
      type: 'subnet',
      state: 'syncing',
      chainId: '88888',
      blockHeight: 12345,
      validators: 4,
      uptime: 95.2,
      syncProgress: 67,
      lastActivity: '5 sec ago',
      cpu: 82,
      memory: 71,
      network: 89,
    },
    {
      id: '4',
      name: 'Analytics Chain',
      type: 'subnet',
      state: 'stopped',
      chainId: '77777',
      blockHeight: 234567,
      validators: 6,
      uptime: 92.1,
      lastActivity: '2 hours ago',
      cpu: 0,
      memory: 0,
      network: 0,
    },
  ]);

  const getStateConfig = (state: Blockchain['state']) => {
    switch (state) {
      case 'running':
        return {
          icon: CheckCircle,
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20',
          label: 'Running',
        };
      case 'stopped':
        return {
          icon: Square,
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/20',
          label: 'Stopped',
        };
      case 'starting':
      case 'stopping':
        return {
          icon: Clock,
          color: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/20',
          label: state === 'starting' ? 'Starting...' : 'Stopping...',
        };
      case 'syncing':
        return {
          icon: Activity,
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20',
          label: 'Syncing',
        };
      case 'error':
        return {
          icon: XCircle,
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          label: 'Error',
        };
      default:
        return {
          icon: Activity,
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/20',
          label: 'Unknown',
        };
    }
  };

  const handleStateChange = (blockchainId: string, action: 'start' | 'stop' | 'restart') => {
    setBlockchains(prev =>
      prev.map(chain => {
        if (chain.id === blockchainId) {
          if (action === 'start') {
            return { ...chain, state: 'starting' as const };
          } else if (action === 'stop') {
            return { ...chain, state: 'stopping' as const };
          } else if (action === 'restart') {
            return { ...chain, state: 'stopping' as const };
          }
        }
        return chain;
      })
    );

    // Simulate state transition
    setTimeout(() => {
      setBlockchains(prev =>
        prev.map(chain => {
          if (chain.id === blockchainId) {
            if (action === 'start' || action === 'restart') {
              return { ...chain, state: 'running' as const };
            } else if (action === 'stop') {
              return { ...chain, state: 'stopped' as const };
            }
          }
          return chain;
        })
      );
    }, 2000);
  };

  const getResourceColor = (usage: number) => {
    if (usage < 60) return 'bg-green-500';
    if (usage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3>Blockchain Lifecycle Management</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor and control all blockchain instances
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-2">Total Chains</p>
          <p className="text-2xl">{blockchains.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-2">Running</p>
          <p className="text-2xl text-green-600 dark:text-green-400">
            {blockchains.filter(b => b.state === 'running').length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-2">Syncing</p>
          <p className="text-2xl text-blue-600 dark:text-blue-400">
            {blockchains.filter(b => b.state === 'syncing').length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-2">Stopped</p>
          <p className="text-2xl text-gray-600 dark:text-gray-400">
            {blockchains.filter(b => b.state === 'stopped').length}
          </p>
        </div>
      </div>

      {/* Blockchain Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {blockchains.map((chain) => {
          const stateConfig = getStateConfig(chain.state);
          const StateIcon = stateConfig.icon;

          return (
            <div
              key={chain.id}
              className={cn(
                'bg-card border-2 rounded-lg p-6 transition-all',
                stateConfig.borderColor
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4>{chain.name}</h4>
                    <Badge variant="outline" className="uppercase text-xs">
                      {chain.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn(stateConfig.bgColor, stateConfig.color, stateConfig.borderColor)}>
                      <StateIcon className="w-3 h-3 mr-1" />
                      {stateConfig.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Chain ID: {chain.chainId}
                    </span>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {chain.state === 'stopped' && (
                      <DropdownMenuItem onClick={() => handleStateChange(chain.id, 'start')}>
                        <Play className="w-4 h-4 mr-2" />
                        Start
                      </DropdownMenuItem>
                    )}
                    {chain.state === 'running' && (
                      <>
                        <DropdownMenuItem onClick={() => handleStateChange(chain.id, 'restart')}>
                          <RotateCw className="w-4 h-4 mr-2" />
                          Restart
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStateChange(chain.id, 'stop')}>
                          <Square className="w-4 h-4 mr-2" />
                          Stop
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600 dark:text-red-400">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Sync Progress (if syncing) */}
              {chain.state === 'syncing' && chain.syncProgress !== undefined && (
                <div className="mb-4 p-3 bg-blue-500/10 rounded-lg">
                  <div className="flex items-center justify-between mb-2 text-sm">
                    <span className="text-blue-600 dark:text-blue-400">Synchronizing</span>
                    <span className="text-blue-600 dark:text-blue-400">{chain.syncProgress}%</span>
                  </div>
                  <Progress value={chain.syncProgress} className="h-2" />
                </div>
              )}

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Block Height</p>
                  <p className="text-sm">#{chain.blockHeight.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Validators</p>
                  <p className="text-sm">{chain.validators}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Uptime</p>
                  <p className="text-sm">{chain.uptime}%</p>
                </div>
              </div>

              {/* Resource Usage */}
              {chain.state !== 'stopped' && (
                <div className="space-y-3 mb-4">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">CPU</span>
                      <span>{chain.cpu}%</span>
                    </div>
                    <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full transition-all', getResourceColor(chain.cpu))}
                        style={{ width: `${chain.cpu}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Memory</span>
                      <span>{chain.memory}%</span>
                    </div>
                    <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full transition-all', getResourceColor(chain.memory))}
                        style={{ width: `${chain.memory}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Network</span>
                      <span>{chain.network}%</span>
                    </div>
                    <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full transition-all', getResourceColor(chain.network))}
                        style={{ width: `${chain.network}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  Last activity: {chain.lastActivity}
                </span>
                <div className="flex gap-2">
                  {chain.state === 'running' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStateChange(chain.id, 'restart')}
                      >
                        <RotateCw className="w-3 h-3 mr-1" />
                        Restart
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStateChange(chain.id, 'stop')}
                      >
                        <Square className="w-3 h-3 mr-1" />
                        Stop
                      </Button>
                    </>
                  )}
                  {chain.state === 'stopped' && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleStateChange(chain.id, 'start')}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Start
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
