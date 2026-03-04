'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useNetwork } from '@/context/NetworkContext';
import api from '@/lib/api';

export function SettingsView() {
  const { selectedNetwork } = useNetwork();
  const [nodeHealth, setNodeHealth] = useState<any>(null);

  const [settings, setSettings] = useState({
    consoleName: 'BaaS Console',
    autoRefresh: true,
    refreshInterval: 30,
    rpcEndpoint: 'http://127.0.0.1:9650',
    backendUrl: 'http://localhost:4000',
  });

  // Load from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('baas_settings');
      if (saved) {
        try { setSettings(JSON.parse(saved)); } catch { }
      }
    }
  }, []);

  // Fetch node health
  useEffect(() => {
    api.node.dashboard(selectedNetwork?.rpcUrl).then(setNodeHealth).catch(() => { });
  }, [selectedNetwork]);

  const handleSave = () => {
    localStorage.setItem('baas_settings', JSON.stringify(settings));
    toast.success('Settings saved');
  };

  const handleTestConnection = async () => {
    try {
      const res = await api.node.status(selectedNetwork?.rpcUrl);
      if (res.healthy) {
        toast.success('Connection successful', { description: `Version: ${res.version || 'N/A'}` });
      } else {
        toast.warning('Node reachable but unhealthy');
      }
    } catch {
      toast.error('Connection failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">Console preferences</p>
        </div>
        <Button onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* General Settings */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-6">
        <div>
          <h3 className="font-medium flex items-center gap-2">
            <Settings className="w-4 h-4" /> General
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Console appearance and behavior</p>
        </div>

        <Separator />

        <div className="space-y-4">
          <div>
            <Label htmlFor="consoleName">Console Name</Label>
            <Input
              id="consoleName"
              value={settings.consoleName}
              onChange={(e) => setSettings({ ...settings, consoleName: e.target.value })}
              className="mt-2"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Auto Refresh</Label>
              <p className="text-sm text-muted-foreground mt-1">Automatically refresh dashboard data</p>
            </div>
            <Switch
              checked={settings.autoRefresh}
              onCheckedChange={(checked) => setSettings({ ...settings, autoRefresh: checked })}
            />
          </div>

          {settings.autoRefresh && (
            <div>
              <Label htmlFor="refreshInterval">Refresh Interval (seconds)</Label>
              <Input
                id="refreshInterval"
                type="number"
                value={settings.refreshInterval}
                onChange={(e) => setSettings({ ...settings, refreshInterval: parseInt(e.target.value) || 30 })}
                min="10"
                max="300"
                className="mt-2"
              />
            </div>
          )}
        </div>
      </div>

      {/* Network Settings */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-6">
        <div>
          <h3 className="font-medium flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Network
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Connection and endpoints</p>
        </div>

        <Separator />

        <div className="space-y-4">
          <div>
            <Label htmlFor="backendUrl">Backend URL</Label>
            <Input
              id="backendUrl"
              value={settings.backendUrl}
              onChange={(e) => setSettings({ ...settings, backendUrl: e.target.value })}
              className="mt-2"
            />
          </div>

          <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-2 text-sm">
            <h4 className="font-medium">Current Connection</h4>
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">Network:</span>
              <span>{selectedNetwork?.name || 'Primary'}</span>
              <span className="text-muted-foreground">Status:</span>
              <span className={nodeHealth?.healthy ? 'text-green-600' : 'text-red-500'}>
                {nodeHealth?.healthy ? '● Connected' : '● Disconnected'}
              </span>
              <span className="text-muted-foreground">Block Height:</span>
              <span>{nodeHealth?.blockHeight?.toLocaleString() || 'N/A'}</span>
              <span className="text-muted-foreground">Peers:</span>
              <span>{nodeHealth?.peerCount || 'N/A'}</span>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={handleTestConnection}>
            Test Connection
          </Button>
        </div>
      </div>
    </div>
  );
}
