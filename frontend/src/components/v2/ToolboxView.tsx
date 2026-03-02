import {
  Plus, Users, Link2, Settings2, FileCheck, Zap, GitBranch,
  RefreshCw, Box, Radio, ArrowLeftRight, Wrench
} from 'lucide-react';
import { ToolCard } from './ToolCard';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export function ToolboxView() {
  const tools = [
    {
      title: 'Create Chain',
      description: 'Launch your custom L1 blockchain',
      icon: Plus
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
      title: 'Native Token Remote',
      description: 'Deploy native token bridge contracts',
      icon: Radio
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
      title: 'Format Converter',
      description: 'Convert between data formats',
      icon: ArrowLeftRight
    },
    {
      title: 'Cross-Chain Transfer',
      description: 'Transfer AVAX between P-Chain and C-Chain on the Primary Network',
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
    },
    {
      title: 'Faucet',
      description: 'Get free AVAX tokens for testing',
      icon: Wrench
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2>Toolbox</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Explore blockchain tools and utilities
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search tools..."
          className="pl-9"
        />
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool, idx) => (
          <ToolCard
            key={idx}
            {...tool}
            onClick={() => console.log(`Clicked: ${tool.title}`)}
          />
        ))}
      </div>

      {/* Ecosystem Section */}
      <div className="pt-8">
        <h3 className="mb-4">Explore Avalanche L1s</h3>
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <p className="text-muted-foreground mb-4">
            Discover popular L1 blockchains and DeFi protocols in the Avalanche ecosystem
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {['FIFA Blockchain', 'MapleStory Haneiys', 'Dexalot Exchange', 'DeFi Kingdoms', 'Laminal', 'Sheen Defi Dialite'].map((name) => (
              <div key={name} className="px-4 py-2 bg-muted rounded-lg text-sm">
                {name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
