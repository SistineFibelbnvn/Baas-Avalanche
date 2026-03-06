"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/v2/Sidebar";
import { TopBar } from "@/components/v2/TopBar";
import { ComprehensiveDashboard } from "@/components/v2/ComprehensiveDashboard";
import { BlockchainLifecyclePanel } from "@/components/v2/BlockchainLifecyclePanel";
import { NodesView } from "@/components/v2/NodesView";
import { MonitoringView } from "@/components/v2/MonitoringView";
import { ValidatorsView } from "@/components/v2/ValidatorsView";
import { ContractsView } from "@/components/v2/ContractsView";
import { SettingsView } from "@/components/v2/SettingsView";
import { BlockExplorerView } from "@/components/v2/BlockExplorerView";
import { ConfigurationView } from "@/components/v2/ConfigurationView";
import { SubnetManagementView } from "@/components/v2/SubnetManagementView";
import { FaucetView } from "@/components/v2/FaucetView";

import { CreateChainWizard } from "@/components/v2/CreateChainWizard";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

export default function Home() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeView, setActiveView] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('activeView') || 'dashboard';
    }
    return 'dashboard';
  });
  const [selectedNetwork, setSelectedNetwork] = useState('mainnet');
  const [showCreateChain, setShowCreateChain] = useState(false);

  // Persist active view
  const handleNavigate = (view: string) => {
    setActiveView(view);
    localStorage.setItem('activeView', view);
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    // Check if we are in browser environment
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      const initialTheme = savedTheme || systemTheme;
      setTheme(initialTheme);

      if (initialTheme === 'dark') {
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);

    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleCreateChain = async (data: any) => {
    try {
      console.log('Creating blockchain (mapped):', data);
      await import('@/lib/api').then(({ api }) => api.subnets.create({
        name: data.chainName,
        vmType: data.vmType === 'evm' ? 'subnet-evm' : 'custom',
        chainId: parseInt(data.chainId),
        tokenSymbol: data.tokenSymbol,
        tokenSupply: data.initialSupply,
        // Default mappings
        configMode: 'test',
        validatorType: data.consensusMechanism === 'pos' ? 'pos' : 'poa',
        enableICM: true
      }));

      toast.success('Blockchain Creation Started!', {
        description: `${data.chainName} is being deployed. Check 'Subnets' for status.`,
      });
      setShowCreateChain(false);
      // Switch to subnets view to see progress
      handleNavigate('subnets');
    } catch (error) {
      console.error('Failed to create chain:', error);
      toast.error('Failed to create blockchain', {
        description: (error as Error).message || 'Unknown error occurred',
      });
    }
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <ComprehensiveDashboard onCreateChain={() => setShowCreateChain(true)} onNavigate={handleNavigate} />;
      case 'subnets':
        return <SubnetManagementView />;
      case 'explorer':
        return <BlockExplorerView />;
      case 'nodes':
        return <NodesView />;
      case 'validators':
        return <ValidatorsView />;
      case 'contracts':
        return <ContractsView />;
      case 'faucet':
        return <FaucetView />;
      case 'monitoring':
        return <MonitoringView />;
      case 'configuration':
        return <ConfigurationView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <ComprehensiveDashboard onCreateChain={() => setShowCreateChain(true)} />;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar
        activeItem={activeView}
        onNavigate={handleNavigate}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <TopBar
          theme={theme}
          onThemeToggle={toggleTheme}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {renderView()}
          </div>
        </main>
      </div>

      {/* Create Chain Wizard */}
      {showCreateChain && (
        <CreateChainWizard
          onClose={() => setShowCreateChain(false)}
          onComplete={handleCreateChain}
        />
      )}

      {/* Notifications */}
      <Toaster position="top-right" />
    </div>
  );
}
