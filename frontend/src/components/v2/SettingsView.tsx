import { useState } from 'react';
import { Settings, User, Network, Bell, Shield, Database, Key, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

export function SettingsView() {
  const [settings, setSettings] = useState({
    // General
    consoleName: 'BaaS Console',
    defaultNetwork: 'mainnet',
    autoRefresh: true,
    refreshInterval: 30,
    
    // Notifications
    emailNotifications: true,
    blockNotifications: true,
    validatorNotifications: true,
    errorNotifications: true,
    
    // Security
    twoFactorAuth: false,
    sessionTimeout: 60,
    ipWhitelist: '',
    
    // API
    apiKey: '••••••••••••••••••••••••••••••••',
    webhookUrl: '',
    rpcEndpoint: 'https://api.avax.network',
  });

  const handleSave = () => {
    console.log('Saving settings:', settings);
    // Show success notification
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2>Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure your BaaS console preferences
          </p>
        </div>
        <Button onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general">
            <Settings className="w-4 h-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="network">
            <Network className="w-4 h-4 mr-2" />
            Network
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="api">
            <Key className="w-4 h-4 mr-2" />
            API & Integrations
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="mt-6 space-y-6">
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            <div>
              <h3>Console Settings</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Customize your console appearance and behavior
              </p>
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

              <div>
                <Label htmlFor="defaultNetwork">Default Network</Label>
                <select
                  id="defaultNetwork"
                  value={settings.defaultNetwork}
                  onChange={(e) => setSettings({ ...settings, defaultNetwork: e.target.value })}
                  className="mt-2 w-full px-3 py-2 bg-input-background border border-border rounded-lg"
                >
                  <option value="mainnet">Primary Network (C-Chain)</option>
                  <option value="testnet">Fuji Testnet</option>
                  <option value="local">Local Network</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto Refresh</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Automatically refresh dashboard data
                  </p>
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
                    onChange={(e) => setSettings({ ...settings, refreshInterval: parseInt(e.target.value) })}
                    min="10"
                    max="300"
                    className="mt-2"
                  />
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Network Tab */}
        <TabsContent value="network" className="mt-6 space-y-6">
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            <div>
              <h3>Network Configuration</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Configure network endpoints and parameters
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <div>
                <Label htmlFor="rpcEndpoint">RPC Endpoint</Label>
                <Input
                  id="rpcEndpoint"
                  value={settings.rpcEndpoint}
                  onChange={(e) => setSettings({ ...settings, rpcEndpoint: e.target.value })}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Primary RPC endpoint for blockchain interactions
                </p>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h4 className="text-sm mb-3">Network Status</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Connection:</span>
                    <span className="text-green-600 dark:text-green-400">Connected</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Latency:</span>
                    <span>45ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Block Height:</span>
                    <span>9,876,543</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Chain ID:</span>
                    <span>43114</span>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full">
                Test Connection
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-6 space-y-6">
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            <div>
              <h3>Notification Preferences</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Choose which notifications you want to receive
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Receive email alerts for important events
                  </p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>New Block Notifications</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Alert when new blocks are produced
                  </p>
                </div>
                <Switch
                  checked={settings.blockNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, blockNotifications: checked })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Validator Alerts</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Notify about validator status changes
                  </p>
                </div>
                <Switch
                  checked={settings.validatorNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, validatorNotifications: checked })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Error Notifications</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Critical errors and system failures
                  </p>
                </div>
                <Switch
                  checked={settings.errorNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, errorNotifications: checked })}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-6 space-y-6">
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            <div>
              <h3>Security Settings</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Protect your account and data
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Switch
                  checked={settings.twoFactorAuth}
                  onCheckedChange={(checked) => setSettings({ ...settings, twoFactorAuth: checked })}
                />
              </div>

              <Separator />

              <div>
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                  min="5"
                  max="480"
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Automatically log out after period of inactivity
                </p>
              </div>

              <div>
                <Label htmlFor="ipWhitelist">IP Whitelist</Label>
                <Input
                  id="ipWhitelist"
                  value={settings.ipWhitelist}
                  onChange={(e) => setSettings({ ...settings, ipWhitelist: e.target.value })}
                  placeholder="192.168.1.1, 10.0.0.1"
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Comma-separated list of allowed IP addresses
                </p>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  ⚠️ <strong>Security Warning:</strong> Make sure to keep your credentials safe. Never share your API keys or private keys with anyone.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* API Tab */}
        <TabsContent value="api" className="mt-6 space-y-6">
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            <div>
              <h3>API & Integrations</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Manage API keys and external integrations
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <div>
                <Label htmlFor="apiKey">API Key</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="apiKey"
                    type="password"
                    value={settings.apiKey}
                    readOnly
                    className="flex-1"
                  />
                  <Button variant="outline">
                    Regenerate
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Use this key to authenticate API requests
                </p>
              </div>

              <div>
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <Input
                  id="webhookUrl"
                  value={settings.webhookUrl}
                  onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
                  placeholder="https://your-server.com/webhook"
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Receive real-time event notifications
                </p>
              </div>

              <div className="bg-card border-2 border-border rounded-lg p-4">
                <h4 className="text-sm mb-3">API Documentation</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Learn how to integrate with our API and automate your blockchain operations.
                </p>
                <Button variant="outline" size="sm">
                  View Documentation
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
