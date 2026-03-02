import { useState, useEffect } from 'react';
import { Network, GitBranch, Layers, Circle, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { api } from '@/lib/api';

interface ChainInfo {
  id: string;
  name: string;
  type: string;
  description?: string;
  color: string;
  validators: number;
  blockHeight: number;
}

interface SubnetInfo {
  id: string;
  name: string;
  type: string;
  validators: number;
  chains: { name: string; chainId: string; blockHeight: number }[];
  color: string;
}

export function NetworkTopologyView() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [subnets, setSubnets] = useState<SubnetInfo[]>([]);
  const [primaryValidators, setPrimaryValidators] = useState(0);

  const colors = ['bg-orange-500', 'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500'];

  // Default Primary Network Structure
  const primaryNetwork = {
    name: 'Primary Network',
    chains: [
      {
        id: 'p-chain',
        name: 'P-Chain',
        type: 'Platform',
        description: 'Coordinates validators and manages subnets',
        color: 'bg-blue-500',
        validators: primaryValidators,
        blockHeight: 0, // Would need dedicated API for block height
      },
      {
        id: 'c-chain',
        name: 'C-Chain',
        type: 'Contract',
        description: 'EVM-compatible smart contract platform',
        color: 'bg-green-500',
        validators: primaryValidators,
        blockHeight: 0,
      },
      {
        id: 'x-chain',
        name: 'X-Chain',
        type: 'Exchange',
        description: 'DAG-based asset creation and exchange',
        color: 'bg-purple-500',
        validators: primaryValidators,
        blockHeight: 0,
      },
    ],
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Primary Validators
        const pValidators = await api.pchain.getValidators();
        setPrimaryValidators(pValidators.length);

        // Fetch Subnets
        const subnetsData = await api.pchain.getSubnets();

        // Transform raw subnet data to UI format
        // Note: Retrieving validators for EVERY subnet might be heavy, 
        // effectively we might just count them if the API supported it.
        // For now, we'll map the subnet list.
        const mappedSubnets: SubnetInfo[] = subnetsData.map((s: any, idx: number) => ({
          id: s.id,
          name: s.name || `Subnet ${s.id.slice(0, 8)}`, // Fallback name
          type: 'permissioned', // Most subnets are permissioned by default
          validators: 0, // Would need individual fetches
          chains: s.blockchains ? s.blockchains.map((bc: any) => ({
            name: bc.name,
            chainId: bc.id, // Using ID as chainId display
            blockHeight: 0
          })) : [],
          color: colors[idx % colors.length]
        }));

        setSubnets(mappedSubnets);
      } catch (err) {
        console.error("Failed to fetch topology data", err);
      }
    };

    fetchData();
  }, []);

  const getNodeInfo = (nodeId: string) => {
    if (nodeId.startsWith('p-chain')) return primaryNetwork.chains[0];
    if (nodeId.startsWith('c-chain')) return primaryNetwork.chains[1];
    if (nodeId.startsWith('x-chain')) return primaryNetwork.chains[2];

    const subnet = subnets.find(s => nodeId === s.id);
    if (subnet) return subnet;

    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2>Network Topology</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Visualize Avalanche Primary Network and Subnets architecture
        </p>
      </div>

      <Tabs defaultValue="visual" className="w-full">
        <TabsList>
          <TabsTrigger value="visual">Visual Topology</TabsTrigger>
          <TabsTrigger value="details">Network Details</TabsTrigger>
        </TabsList>

        {/* Visual Topology Tab */}
        <TabsContent value="visual" className="mt-6">
          <div className="bg-card border border-border rounded-lg p-8">
            {/* Primary Network */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <Layers className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3>Primary Network</h3>
                  <p className="text-sm text-muted-foreground">Core Avalanche blockchain infrastructure</p>
                </div>
              </div>

              {/* Three Core Chains */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {primaryNetwork.chains.map((chain) => (
                  <button
                    key={chain.id}
                    onClick={() => setSelectedNode(chain.id)}
                    className={`p-6 border-2 rounded-lg transition-all hover:shadow-lg text-left ${selectedNode === chain.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                      }`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-lg ${chain.color} flex items-center justify-center`}>
                        <GitBranch className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4>{chain.name}</h4>
                        <p className="text-xs text-muted-foreground">{chain.type} Chain</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{chain.description}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Validators:</span>
                        <span>{chain.validators.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Block Height:</span>
                        <span>#{chain.blockHeight.toLocaleString()}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Connection Lines Visual */}
              <div className="flex items-center justify-center mb-8">
                <div className="flex flex-col items-center">
                  <Circle className="w-8 h-8 text-blue-500 fill-blue-500/20" />
                  <div className="w-0.5 h-12 bg-gradient-to-b from-blue-500 to-transparent" />
                </div>
              </div>
            </div>

            {/* Subnets */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
                  <Network className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3>Subnets (L1 Blockchains)</h3>
                  <p className="text-sm text-muted-foreground">Custom sovereign networks built on Avalanche</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {subnets.map((subnet) => (
                  <button
                    key={subnet.id}
                    onClick={() => setSelectedNode(subnet.id)}
                    className={`p-6 border-2 rounded-lg transition-all hover:shadow-lg text-left ${selectedNode === subnet.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                      }`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-lg ${subnet.color} flex items-center justify-center`}>
                        <Network className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4>{subnet.name}</h4>
                        <Badge className={
                          subnet.type === 'elastic'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                            : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                        }>
                          {subnet.type}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Validators:</span>
                        <span>{subnet.validators}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Blockchains:</span>
                        <span>{subnet.chains.length}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground mb-2">Blockchains:</p>
                      {subnet.chains.map((chain, idx) => (
                        <div key={idx} className="bg-muted/30 rounded p-2 text-xs">
                          <div className="flex justify-between">
                            <span>{chain.name}</span>
                            <code className="text-muted-foreground">#{chain.chainId}</code>
                          </div>
                        </div>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Info Panel */}
            {selectedNode && (
              <div className="mt-8 p-6 bg-primary/5 border-2 border-primary/20 rounded-lg">
                <h4 className="mb-4">Selected: {getNodeInfo(selectedNode)?.name}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Type</p>
                    <p>{selectedNode.startsWith('p-chain') ? 'Platform Chain' :
                      selectedNode.startsWith('c-chain') ? 'Contract Chain' :
                        selectedNode.startsWith('x-chain') ? 'Exchange Chain' : 'Subnet'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Status</p>
                    <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                      Active
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Validators</p>
                    <p>{getNodeInfo(selectedNode)?.validators}</p>
                  </div>
                  <div>
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Network Details Tab */}
        <TabsContent value="details" className="mt-6 space-y-6">
          {/* Primary Network Details */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="p-6 border-b border-border bg-gradient-to-r from-blue-500/10 to-purple-500/10">
              <div className="flex items-center gap-3">
                <Layers className="w-6 h-6 text-blue-500" />
                <div>
                  <h3>Primary Network</h3>
                  <p className="text-sm text-muted-foreground">Core Avalanche infrastructure</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-border">
              {primaryNetwork.chains.map((chain) => (
                <div key={chain.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${chain.color} flex items-center justify-center`}>
                        <GitBranch className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4>{chain.name}</h4>
                        <p className="text-sm text-muted-foreground">{chain.type} Chain</p>
                      </div>
                    </div>
                    <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                      Operational
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{chain.description}</p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Validators</p>
                      <p>{chain.validators.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Block Height</p>
                      <p>#{chain.blockHeight.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Consensus</p>
                      <p>Snowman++</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subnets Details */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="p-6 border-b border-border bg-gradient-to-r from-orange-500/10 to-pink-500/10">
              <div className="flex items-center gap-3">
                <Network className="w-6 h-6 text-orange-500" />
                <div>
                  <h3>Subnets</h3>
                  <p className="text-sm text-muted-foreground">Custom L1 blockchain networks</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-border">
              {subnets.map((subnet) => (
                <div key={subnet.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${subnet.color} flex items-center justify-center`}>
                        <Network className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4>{subnet.name}</h4>
                        <Badge className={
                          subnet.type === 'elastic'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                            : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                        }>
                          {subnet.type}
                        </Badge>
                      </div>
                    </div>
                    <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                      Active
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-muted-foreground mb-1">Validators</p>
                      <p>{subnet.validators}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Blockchains</p>
                      <p>{subnet.chains.length}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">VM Type</p>
                      <p>SubnetEVM</p>
                    </div>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm mb-3">Blockchains in this subnet:</p>
                    <div className="space-y-2">
                      {subnet.chains.map((chain, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span>{chain.name}</span>
                          <div className="flex items-center gap-3">
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              Chain ID: {chain.chainId}
                            </code>
                            <span className="text-muted-foreground">
                              #{chain.blockHeight.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
