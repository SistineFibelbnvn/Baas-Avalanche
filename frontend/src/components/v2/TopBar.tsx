'use client';

import { Moon, Sun, Bell, Search, RefreshCw, Loader2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNetwork, Network } from '@/context/NetworkContext';
import { ConnectWallet } from '@/components/contracts/ConnectWallet';
import { useAuth } from '@/context/AuthContext';

interface TopBarProps {
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

// Get status color for network indicator
function getStatusColor(network: Network): string {
  if (network.isPrimary) return 'bg-green-500';

  switch (network.status) {
    case 'RUNNING':
      return 'bg-green-500';
    case 'CREATING':
    case 'DEPLOYING':
      return 'bg-yellow-500 animate-pulse';
    case 'FAILED':
      return 'bg-red-500';
    default:
      return 'bg-blue-500';
  }
}

export function TopBar({ theme, onThemeToggle }: TopBarProps) {
  const { networks, selectedNetwork, selectNetwork, refreshNetworks, isLoading } = useNetwork();
  const { user, logout } = useAuth();

  const handleNetworkChange = (networkId: string) => {
    const network = networks.find(n => n.id === networkId);
    if (network) {
      selectNetwork(network);
    }
  };

  return (
    <div className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      {/* Left: Network Selector */}
      <div className="flex items-center gap-2">
        <Select
          value={selectedNetwork?.id || 'primary-c-chain'}
          onValueChange={handleNetworkChange}
        >
          <SelectTrigger className="w-[280px]">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${selectedNetwork ? getStatusColor(selectedNetwork) : 'bg-gray-500'}`} />
              <SelectValue placeholder="Select network">
                {selectedNetwork?.name || 'Select Network'}
              </SelectValue>
            </div>
          </SelectTrigger>
          <SelectContent>
            {networks.map(network => (
              <SelectItem key={network.id} value={network.id}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(network)}`} />
                  <span>{network.name}</span>
                  {!network.isPrimary && network.chainId && (
                    <span className="text-xs text-muted-foreground ml-1">
                      (Chain ID: {network.chainId})
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => refreshNetworks()}
          disabled={isLoading}
          title="Refresh networks"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Center: Selected Network Info */}
      {selectedNetwork && !selectedNetwork.isPrimary && selectedNetwork.rpcUrl && (
        <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground">
          <span>RPC:</span>
          <code className="bg-muted px-2 py-1 rounded max-w-[300px] truncate">
            {selectedNetwork.rpcUrl}
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(selectedNetwork.rpcUrl);
            }}
            className="text-muted-foreground hover:text-foreground"
            title="Copy RPC URL"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      )}

      {/* Right: Search, Notifications, Theme Toggle */}
      <div className="flex items-center gap-3">
        {/* Wallet Connect */}
        <ConnectWallet />

        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search..."
            className="pl-9 w-[200px]"
          />
        </div>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
        </Button>

        <Button variant="ghost" size="icon" onClick={onThemeToggle}>
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        {/* User info + Logout */}
        {user && (
          <div className="flex items-center gap-2 ml-2 pl-3 border-l border-border min-w-0">
            <div className="hidden md:flex flex-col items-end min-w-0 max-w-[120px]">
              <span className="text-xs font-medium text-foreground truncate w-full text-right">{user.name}</span>
              <span className="text-[10px] text-muted-foreground truncate w-full text-right">{user.email}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              title="Sign out"
              className="text-muted-foreground hover:text-red-500 flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
