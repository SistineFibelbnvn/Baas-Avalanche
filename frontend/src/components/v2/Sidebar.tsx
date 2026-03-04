import { LayoutDashboard, Network, Shield, FileCode, Activity, Settings, ChevronRight, Blocks, Sliders } from 'lucide-react';
import { cn } from '@/components/ui/utils';

interface SidebarProps {
  activeItem: string;
  onNavigate: (item: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'main' },
  { id: 'subnets', label: 'Subnets', icon: Network, category: 'main' },
  { id: 'explorer', label: 'Block Explorer', icon: Blocks, category: 'main' },
  { id: 'nodes', label: 'Nodes', icon: Network, category: 'main' },
  { id: 'validators', label: 'Validators', icon: Shield, category: 'main' },
  { id: 'contracts', label: 'Contracts', icon: FileCode, category: 'main' },
  { id: 'monitoring', label: 'Monitoring', icon: Activity, category: 'main' },
  { id: 'configuration', label: 'Configuration', icon: Sliders, category: 'system' },
  { id: 'settings', label: 'Settings', icon: Settings, category: 'system' },
];

export function Sidebar({ activeItem, onNavigate }: SidebarProps) {
  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-semibold">BC</span>
          </div>
          <div>
            <h1 className="text-sidebar-foreground">BaaS Console</h1>
            <p className="text-xs text-muted-foreground">Blockchain Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="space-y-1">
          <p className="px-3 py-2 text-xs text-muted-foreground uppercase tracking-wider">Main</p>
          {navItems
            .filter(item => item.category === 'main')
            .map(item => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left text-sm">{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 flex-shrink-0" />}
                </button>
              );
            })}
        </div>

        <div className="space-y-1 pt-4">
          <p className="px-3 py-2 text-xs text-muted-foreground uppercase tracking-wider">System</p>
          {navItems
            .filter(item => item.category === 'system')
            .map(item => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left text-sm">{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 flex-shrink-0" />}
                </button>
              );
            })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="text-xs text-muted-foreground text-center">
          v1.0.0 • 2025
        </div>
      </div>
    </div>
  );
}
