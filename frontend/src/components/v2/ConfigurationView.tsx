'use client';

import { useState } from 'react';
import { FileCode, Save, Download, Upload, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useNetwork } from '@/context/NetworkContext';

export function ConfigurationView() {
  const { selectedNetwork } = useNetwork();

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
    "subnetEVMTimestamp": 0
  },
  "alloc": {
    "8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC": {
      "balance": "0x295BE96E64066972000000"
    }
  },
  "gasLimit": "0x7A1200",
  "difficulty": "0x0",
  "nonce": "0x0",
  "timestamp": "0x0"
}`);

  const handleDownload = () => {
    const blob = new Blob([genesisConfig], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'genesis.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Genesis file downloaded');
  };

  const handleUpload = () => {
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
            JSON.parse(content);
            setGenesisConfig(content);
            toast.success('Genesis file loaded');
          } catch { toast.error('Invalid JSON file'); }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleValidate = () => {
    try {
      const parsed = JSON.parse(genesisConfig);
      if (!parsed.config || !parsed.alloc) {
        toast.warning('Missing required fields: config, alloc');
      } else {
        toast.success('Genesis JSON is valid ✓');
      }
    } catch { toast.error('Invalid JSON format'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Configuration</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Genesis configuration editor
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleUpload}>
            <Upload className="w-4 h-4 mr-2" /> Upload
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" /> Download
          </Button>
          <Button size="sm" onClick={handleValidate}>
            <Save className="w-4 h-4 mr-2" /> Validate
          </Button>
        </div>
      </div>

      {/* Network info */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Selected Network</p>
          <p className="font-medium">{selectedNetwork?.name || 'Primary Network'}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Chain ID</p>
          <p className="font-medium">{selectedNetwork?.chainId || 'N/A'}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">RPC URL</p>
          <p className="font-medium text-xs truncate">{selectedNetwork?.rpcUrl || 'http://127.0.0.1:9650/ext/bc/C/rpc'}</p>
        </div>
      </div>

      {/* Genesis Editor */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="bg-muted/30 px-4 py-2 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4" />
            <span className="text-sm">genesis.json</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">JSON</Badge>
            <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(genesisConfig); toast.success('Copied'); }}>
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <Textarea
          value={genesisConfig}
          onChange={(e) => setGenesisConfig(e.target.value)}
          className="min-h-[400px] font-mono text-sm border-0 rounded-none resize-none"
          spellCheck={false}
        />
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <p className="text-sm text-blue-600 dark:text-blue-400">
          💡 <strong>Tip:</strong> The genesis file defines the initial state of your blockchain.
          Modify "alloc" to pre-fund addresses. Changes here are for reference — subnets use their
          own genesis generated during creation.
        </p>
      </div>
    </div>
  );
}
