import { useState } from 'react';
import { FileCode, Save, Download, Upload, RefreshCw, Copy, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export function ConfigurationView() {
  const [genesisConfig, setGenesisConfig] = useState(`{
  "config": {
    "chainId": 12345,
    "homesteadBlock": 0,
    "eip150Block": 0,
    "eip155Block": 0,
    "eip158Block": 0,
    "byzantiumBlock": 0,
    "constantinopleBlock": 0,
    "petersburgBlock": 0,
    "istanbulBlock": 0,
    "muirGlacierBlock": 0,
    "subnetEVMTimestamp": 0
  },
  "nonce": "0x0",
  "timestamp": "0x0",
  "extraData": "0x00",
  "gasLimit": "0x7A1200",
  "difficulty": "0x0",
  "mixHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
  "coinbase": "0x0000000000000000000000000000000000000000",
  "alloc": {
    "8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC": {
      "balance": "0x295BE96E64066972000000"
    }
  },
  "airdropHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
  "airdropAmount": null,
  "number": "0x0",
  "gasUsed": "0x0",
  "parentHash": "0x0000000000000000000000000000000000000000000000000000000000000000"
}`);

  const [chainConfig, setChainConfig] = useState({
    networkId: '12345',
    chainName: 'MyDeFi Chain',
    consensus: 'proof-of-stake',
    blockGasLimit: '8000000',
    blockTime: '2',
    validatorSetSize: '10',
    precompiles: true,
  });

  const [showSensitive, setShowSensitive] = useState(false);

  const handleSaveGenesis = async () => {
    try {
      const parsed = JSON.parse(genesisConfig);

      const res = await api.config.validateGenesis(parsed);

      if (res.valid) {
        toast.success('Genesis configuration valid', {
          description: res.message
        });
        // In a real app, we would enable a "Deploy" button here
      } else {
        toast.error('Validation Failed', {
          description: res.message
        });
      }
    } catch (error) {
      toast.error('Invalid JSON format', {
        description: 'Please ensure your genesis config is valid JSON.'
      });
    }
  };

  const handleDownloadGenesis = () => {
    const blob = new Blob([genesisConfig], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'genesis.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Genesis file downloaded');
  };

  const handleUploadGenesis = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          try {
            JSON.parse(content); // Validate JSON
            setGenesisConfig(content);
            toast.success('Genesis file loaded successfully');
          } catch (error) {
            toast.error('Invalid JSON file');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const networkParams = [
    { name: 'Network ID', value: chainConfig.networkId, key: 'networkId' },
    { name: 'Chain Name', value: chainConfig.chainName, key: 'chainName' },
    { name: 'Consensus Mechanism', value: chainConfig.consensus, key: 'consensus' },
    { name: 'Block Gas Limit', value: chainConfig.blockGasLimit, key: 'blockGasLimit' },
    { name: 'Block Time (seconds)', value: chainConfig.blockTime, key: 'blockTime' },
    { name: 'Validator Set Size', value: chainConfig.validatorSetSize, key: 'validatorSetSize' },
  ];

  const precompiledContracts = [
    { address: '0x0100000000000000000000000000000000000000', name: 'Native Minter', enabled: true },
    { address: '0x0200000000000000000000000000000000000000', name: 'Contract Deployer Allowlist', enabled: true },
    { address: '0x0300000000000000000000000000000000000000', name: 'Transaction Allowlist', enabled: false },
    { address: '0x0400000000000000000000000000000000000000', name: 'Fee Manager', enabled: true },
    { address: '0x0500000000000000000000000000000000000000', name: 'Reward Manager', enabled: true },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2>Chain Configuration</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Advanced blockchain configuration and genesis settings
          </p>
        </div>
        <Button onClick={handleSaveGenesis}>
          <Save className="w-4 h-4 mr-2" />
          Save Configuration
        </Button>
      </div>

      <Tabs defaultValue="genesis" className="w-full">
        <TabsList>
          <TabsTrigger value="genesis">
            <FileCode className="w-4 h-4 mr-2" />
            Genesis Config
          </TabsTrigger>
          <TabsTrigger value="network">Network Parameters</TabsTrigger>
          <TabsTrigger value="precompiles">Precompiled Contracts</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* Genesis Config Tab */}
        <TabsContent value="genesis" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3>Genesis Configuration (genesis.json)</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleUploadGenesis}>
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadGenesis}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(genesisConfig)}>
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="bg-muted/30 px-4 py-2 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4" />
                <span className="text-sm">genesis.json</span>
              </div>
              <Badge variant="outline">JSON</Badge>
            </div>
            <Textarea
              value={genesisConfig}
              onChange={(e) => setGenesisConfig(e.target.value)}
              className="min-h-[500px] font-mono text-sm border-0 rounded-none resize-none"
              spellCheck={false}
            />
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              💡 <strong>Tip:</strong> The genesis file defines the initial state of your blockchain.
              Modify the "alloc" section to pre-fund addresses with tokens.
            </p>
          </div>
        </TabsContent>

        {/* Network Parameters Tab */}
        <TabsContent value="network" className="mt-6 space-y-6">
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            <div>
              <h3>Network Parameters</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Core blockchain network settings
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {networkParams.map((param) => (
                <div key={param.key}>
                  <Label htmlFor={param.key}>{param.name}</Label>
                  <Input
                    id={param.key}
                    value={param.value}
                    onChange={(e) => setChainConfig({
                      ...chainConfig,
                      [param.key]: e.target.value
                    })}
                    className="mt-2"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="mb-4">Consensus Configuration</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Mechanism</p>
                <p className="capitalize">{chainConfig.consensus}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Validator Set Size</p>
                <p>{chainConfig.validatorSetSize} validators</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Block Time</p>
                <p>{chainConfig.blockTime} seconds</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Block Gas Limit</p>
                <p>{parseInt(chainConfig.blockGasLimit).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Precompiled Contracts Tab */}
        <TabsContent value="precompiles" className="mt-6">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="p-6 border-b border-border">
              <h3>Precompiled Contracts</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Enable or disable built-in precompiled contracts
              </p>
            </div>

            <div className="divide-y divide-border">
              {precompiledContracts.map((contract, idx) => (
                <div key={idx} className="p-6 flex items-center justify-between hover:bg-muted/30">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4>{contract.name}</h4>
                      <Badge className={
                        contract.enabled
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
                          : 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20'
                      }>
                        {contract.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {contract.address}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(contract.address)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <Button variant={contract.enabled ? 'outline' : 'default'} size="sm">
                    {contract.enabled ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="mt-6 space-y-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="mb-4">Advanced Settings</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <h4 className="text-sm">Enable Debug Mode</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Provides detailed logging for troubleshooting
                  </p>
                </div>
                <Button variant="outline" size="sm">Enable</Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <h4 className="text-sm">Pruning Mode</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Archive or Full pruning configuration
                  </p>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <h4 className="text-sm">Snapshot Sync</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Fast sync using state snapshots
                  </p>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              ⚠️ <strong>Warning:</strong> Changing advanced settings may affect network stability.
              Only modify these if you understand the implications.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
