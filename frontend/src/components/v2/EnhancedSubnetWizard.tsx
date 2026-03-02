'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    Network, Plus, Settings, Users, Zap, Lock, Globe, TrendingUp, Shield, GitBranch,
    Loader2, AlertTriangle, RefreshCw, ExternalLink, Copy, X, Trash2, Wallet,
    Coins, Fuel, FileCode, ChevronRight, ChevronLeft, Check, Maximize2, Minimize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/components/ui/utils';
import { api, Subnet } from '@/lib/api';
import { toast } from 'sonner';
import { useNetwork } from '@/context/NetworkContext';
import { GenesisPreviewPanel } from './GenesisPreviewPanel';
import {
    GenesisFormData,
    defaultGenesisFormData,
    defaultFeeConfig,
    TokenAllocation
} from '@/lib/genesisGenerator';

// Wizard steps
const wizardSteps = [
    { id: 'basics', title: 'Basics', icon: Network },
    { id: 'tokenomics', title: 'Tokenomics', icon: Coins },
    { id: 'fees', title: 'Fee Config', icon: Fuel },
    { id: 'permissions', title: 'Permissions', icon: Lock },
    { id: 'predeploys', title: 'Pre-deploys', icon: FileCode },
];

// Predeploy options with descriptions
const predeployOptions = [
    { id: 'transparentProxy', name: 'Transparent Upgradeable Proxy', desc: 'EIP-1967 proxy pattern' },
    { id: 'proxyAdminContract', name: 'Proxy Admin Contract', desc: 'Admin for proxy upgrades' },
    { id: 'icmMessenger', name: 'ICM Messenger', desc: 'Interchain messaging' },
    { id: 'wrappedNative', name: 'Wrapped Native Token', desc: 'WETH-style wrapper' },
    { id: 'safeSingletonFactory', name: 'Safe Singleton Factory', desc: 'Deterministic deployment' },
    { id: 'multicall3', name: 'Multicall3', desc: 'Batch calls contract' },
    { id: 'create2Deployer', name: 'Create2 Deployer', desc: 'CREATE2 factory' },
];

interface EnhancedSubnetWizardProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function EnhancedSubnetWizard({ open, onOpenChange }: EnhancedSubnetWizardProps) {
    const { networks, refreshNetworks } = useNetwork();

    const connectWallet = async () => {
        if (typeof window !== 'undefined' && (window as any).ethereum) {
            try {
                const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
                if (accounts.length > 0) {
                    setNewAllocation(prev => ({ ...prev, address: accounts[0] }));
                    toast.success('Wallet connected', { description: 'Address loaded from MetaMask' });
                }
            } catch (err) {
                toast.error('Failed to connect wallet', { description: 'Please check MetaMask' });
            }
        } else {
            toast.error('MetaMask not found', { description: 'Please install MetaMask' });
        }
    };

    // Internal state for uncontrolled mode
    const [internalOpen, setInternalOpen] = useState(false);

    // Derived state
    const isOpen = open !== undefined ? open : internalOpen;
    const setIsOpen = onOpenChange || setInternalOpen;

    // Wizard state
    const [currentStep, setCurrentStep] = useState(0);
    const [creating, setCreating] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);

    // Form data with full genesis configuration
    const [formData, setFormData] = useState<GenesisFormData & { name: string }>(
        { ...defaultGenesisFormData, name: '' }
    );

    // New allocation input
    const [newAllocation, setNewAllocation] = useState({ address: '', amount: '' });

    // Update form field
    const updateField = <K extends keyof typeof formData>(
        field: K,
        value: typeof formData[K]
    ) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Update nested field
    const updateNestedField = <T extends keyof typeof formData>(
        parent: T,
        field: string,
        value: any
    ) => {
        setFormData(prev => ({
            ...prev,
            [parent]: {
                ...(prev[parent] as object),
                [field]: value,
            },
        }));
    };

    // Add token allocation
    const addAllocation = () => {
        if (!newAllocation.address || !newAllocation.amount) return;

        setFormData(prev => ({
            ...prev,
            allocations: [...prev.allocations, { ...newAllocation }],
        }));
        setNewAllocation({ address: '', amount: '' });
    };

    // Remove allocation
    const removeAllocation = (index: number) => {
        setFormData(prev => ({
            ...prev,
            allocations: prev.allocations.filter((_, i) => i !== index),
        }));
    };

    // Add address to allowlist
    const addToAllowlist = (
        listType: 'contractDeployerAllowlist' | 'transactionAllowlist' | 'feeManagerAllowlist',
        addressType: 'adminAddresses' | 'managerAddresses' | 'enabledAddresses',
        address: string
    ) => {
        if (!address) return;
        setFormData(prev => ({
            ...prev,
            [listType]: {
                ...prev[listType],
                [addressType]: [...prev[listType][addressType], address],
            },
        }));
    };

    // Remove address from allowlist
    const removeFromAllowlist = (
        listType: 'contractDeployerAllowlist' | 'transactionAllowlist' | 'feeManagerAllowlist',
        addressType: 'adminAddresses' | 'managerAddresses' | 'enabledAddresses',
        index: number
    ) => {
        setFormData(prev => ({
            ...prev,
            [listType]: {
                ...prev[listType],
                [addressType]: prev[listType][addressType].filter((_, i) => i !== index),
            },
        }));
    };

    // Calculate total supply
    const totalSupply = useMemo(() => {
        return formData.allocations.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);
    }, [formData.allocations]);

    // Handle create subnet
    const handleCreate = async () => {
        if (!formData.name) {
            toast.error('Please enter a subnet name');
            return;
        }

        setCreating(true);
        try {
            await api.subnets.create({
                name: formData.name,
                vmType: 'subnet-evm',
                chainId: parseInt(formData.chainId),
                tokenSymbol: formData.tokenSymbol,
                validatorType: 'poa',
                enableICM: formData.predeploys.icmMessenger,
            });

            toast.success('Subnet creation started!', {
                description: 'Check the Subnets page for deployment status.',
            });

            setIsOpen(false);
            refreshNetworks();
            // Reset form
            setFormData({ ...defaultGenesisFormData, name: '' });
            setCurrentStep(0);
        } catch (error) {
            toast.error('Failed to create subnet', {
                description: (error as Error).message,
            });
        } finally {
            setCreating(false);
        }
    };

    // Navigation
    const canGoNext = currentStep < wizardSteps.length - 1;
    const canGoBack = currentStep > 0;
    const isLastStep = currentStep === wizardSteps.length - 1;

    return (
        <>
            {/* Trigger Button - Only show if not controlled or explicitly requested */}
            {open === undefined && (
                <Button onClick={() => setIsOpen(true)} size="lg" className="gap-2">
                    <Plus className="w-5 h-5" />
                    Create Subnet
                </Button>
            )}

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className={cn(
                    "p-0 overflow-hidden flex flex-col transition-all duration-200 bg-background",
                    isMaximized
                        ? "w-[100vw] h-[100vh] max-w-none rounded-none border-0"
                        : "w-full !max-w-[95vw] h-[90vh] rounded-lg"
                )}>
                    <div className="flex flex-col lg:flex-row h-full overflow-hidden">
                        {/* Left Side - Form */}
                        <div className="w-full lg:w-1/2 flex flex-col border-r-0 lg:border-r border-border h-full">
                            {/* Header */}
                            <div className="p-6 border-b border-border flex items-start justify-between shrink-0">
                                <div>
                                    <DialogTitle className="text-xl">Create New Subnet</DialogTitle>
                                    <DialogDescription>
                                        Configure your blockchain genesis parameters
                                    </DialogDescription>
                                </div>
                                <div className="flex items-center gap-2 mr-8">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setIsMaximized(!isMaximized)}
                                        title={isMaximized ? "Restore" : "Maximize"}
                                    >
                                        {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>



                            {/* Step Indicators */}
                            <div className="px-6 py-4 border-b border-border">
                                <div className="flex items-center gap-2">
                                    {wizardSteps.map((step, idx) => {
                                        const Icon = step.icon;
                                        const isActive = idx === currentStep;
                                        const isCompleted = idx < currentStep;

                                        return (
                                            <button
                                                key={step.id}
                                                onClick={() => setCurrentStep(idx)}
                                                className={cn(
                                                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
                                                    isActive && 'bg-primary text-primary-foreground',
                                                    isCompleted && 'bg-green-500/10 text-green-600',
                                                    !isActive && !isCompleted && 'bg-muted text-muted-foreground hover:bg-muted/80'
                                                )}
                                            >
                                                <Icon className="w-4 h-4" />
                                                <span className="hidden lg:inline">{step.title}</span>
                                                {isCompleted && <Check className="w-3 h-3" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Form Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {/* Step 0: Basics */}
                                {currentStep === 0 && (
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="name">Subnet Name</Label>
                                                <Input
                                                    id="name"
                                                    placeholder="MyAwesomeChain"
                                                    value={formData.name}
                                                    onChange={(e) => updateField('name', e.target.value)}
                                                    className="mt-2"
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="chainId">EVM Chain ID</Label>
                                                <Input
                                                    id="chainId"
                                                    type="number"
                                                    placeholder="27923"
                                                    value={formData.chainId}
                                                    onChange={(e) => updateField('chainId', e.target.value)}
                                                    className="mt-2"
                                                />
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Must be unique. Avoid: 1 (ETH), 43114 (AVAX C-Chain)
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Step 1: Tokenomics */}
                                {currentStep === 1 && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Token Name</Label>
                                                <Input
                                                    placeholder="COIN"
                                                    value={formData.tokenName}
                                                    onChange={(e) => updateField('tokenName', e.target.value)}
                                                    className="mt-2"
                                                />
                                            </div>
                                            <div>
                                                <Label>Token Symbol</Label>
                                                <Input
                                                    placeholder="COIN"
                                                    value={formData.tokenSymbol}
                                                    onChange={(e) => updateField('tokenSymbol', e.target.value)}
                                                    className="mt-2"
                                                />
                                            </div>
                                        </div>

                                        {/* Token Allocations */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <Label>Token Allocations</Label>
                                                <span className="text-sm text-muted-foreground">
                                                    Total: {totalSupply.toLocaleString()}
                                                </span>
                                            </div>

                                            {/* Existing allocations */}
                                            {formData.allocations.map((alloc, idx) => (
                                                <div key={idx} className="flex items-center gap-2">
                                                    <code className="flex-1 text-xs bg-muted px-3 py-2 rounded truncate">
                                                        {alloc.address}
                                                    </code>
                                                    <Input
                                                        type="number"
                                                        value={alloc.amount}
                                                        onChange={(e) => {
                                                            const newAllocations = [...formData.allocations];
                                                            newAllocations[idx].amount = e.target.value;
                                                            updateField('allocations', newAllocations);
                                                        }}
                                                        className="w-32"
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeAllocation(idx)}
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            ))}

                                            {/* Add new allocation */}
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    placeholder="0x..."
                                                    value={newAllocation.address}
                                                    onChange={(e) => setNewAllocation(prev => ({ ...prev, address: e.target.value }))}
                                                    className="flex-1"
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder="Amount"
                                                    value={newAllocation.amount}
                                                    onChange={(e) => setNewAllocation(prev => ({ ...prev, amount: e.target.value }))}
                                                    className="w-32"
                                                />
                                                <Button variant="outline" size="sm" onClick={addAllocation}>
                                                    Add
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={connectWallet}>
                                                    <Wallet className="w-4 h-4 mr-1" />
                                                    Wallet
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Native Minter */}
                                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                                            <div>
                                                <Label>Native Token Minter</Label>
                                                <p className="text-xs text-muted-foreground">
                                                    Allow minting additional native tokens after genesis
                                                </p>
                                            </div>
                                            <Switch
                                                checked={formData.nativeMinter}
                                                onCheckedChange={(checked) => updateField('nativeMinter', checked)}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Fee Configuration */}
                                {currentStep === 2 && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Gas Limit</Label>
                                                <Input
                                                    type="number"
                                                    value={formData.feeConfig.gasLimit}
                                                    onChange={(e) => updateNestedField('feeConfig', 'gasLimit', parseInt(e.target.value))}
                                                    className="mt-2"
                                                />
                                            </div>
                                            <div>
                                                <Label>Min Base Fee (gwei)</Label>
                                                <Input
                                                    type="number"
                                                    value={formData.feeConfig.minBaseFee}
                                                    onChange={(e) => updateNestedField('feeConfig', 'minBaseFee', parseInt(e.target.value))}
                                                    className="mt-2"
                                                />
                                            </div>
                                            <div>
                                                <Label>Base Fee Change Denominator</Label>
                                                <Input
                                                    type="number"
                                                    value={formData.feeConfig.baseFeeChangeDenominator}
                                                    onChange={(e) => updateNestedField('feeConfig', 'baseFeeChangeDenominator', parseInt(e.target.value))}
                                                    className="mt-2"
                                                />
                                            </div>
                                            <div>
                                                <Label>Min Block Gas Cost</Label>
                                                <Input
                                                    type="number"
                                                    value={formData.feeConfig.minBlockGasCost}
                                                    onChange={(e) => updateNestedField('feeConfig', 'minBlockGasCost', parseInt(e.target.value))}
                                                    className="mt-2"
                                                />
                                            </div>
                                            <div>
                                                <Label>Max Block Gas Cost</Label>
                                                <Input
                                                    type="number"
                                                    value={formData.feeConfig.maxBlockGasCost}
                                                    onChange={(e) => updateNestedField('feeConfig', 'maxBlockGasCost', parseInt(e.target.value))}
                                                    className="mt-2"
                                                />
                                            </div>
                                            <div>
                                                <Label>Block Gas Cost Step</Label>
                                                <Input
                                                    type="number"
                                                    value={formData.feeConfig.blockGasCostStep}
                                                    onChange={(e) => updateNestedField('feeConfig', 'blockGasCostStep', parseInt(e.target.value))}
                                                    className="mt-2"
                                                />
                                            </div>
                                            <div>
                                                <Label>Target Gas (per 10s)</Label>
                                                <Input
                                                    type="number"
                                                    value={formData.feeConfig.targetGas}
                                                    onChange={(e) => updateNestedField('feeConfig', 'targetGas', parseInt(e.target.value))}
                                                    className="mt-2"
                                                />
                                            </div>
                                            <div>
                                                <Label>Target Block Rate</Label>
                                                <Input
                                                    type="number"
                                                    value={formData.feeConfig.targetBlockRate}
                                                    onChange={(e) => updateNestedField('feeConfig', 'targetBlockRate', parseInt(e.target.value))}
                                                    className="mt-2"
                                                />
                                            </div>
                                        </div>

                                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                            <p className="text-sm text-blue-600 dark:text-blue-400">
                                                <strong>Tip:</strong> For static gas pricing (no congestion adjustments),
                                                set Target Gas {'>'} (Gas Limit × 10 ÷ Block Rate).
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Permissions (Allowlists) */}
                                {currentStep === 3 && (
                                    <div className="space-y-6">
                                        {/* Contract Deployer Allowlist */}
                                        <AllowlistSection
                                            title="Contract Deployer Allowlist"
                                            description="Control who can deploy contracts"
                                            config={formData.contractDeployerAllowlist}
                                            onToggle={(enabled) => updateNestedField('contractDeployerAllowlist', 'enabled', enabled)}
                                            onAddAddress={(type, addr) => addToAllowlist('contractDeployerAllowlist', type, addr)}
                                            onRemoveAddress={(type, idx) => removeFromAllowlist('contractDeployerAllowlist', type, idx)}
                                        />

                                        {/* Transaction Allowlist */}
                                        <AllowlistSection
                                            title="Transaction Allowlist"
                                            description="Control who can submit transactions"
                                            config={formData.transactionAllowlist}
                                            onToggle={(enabled) => updateNestedField('transactionAllowlist', 'enabled', enabled)}
                                            onAddAddress={(type, addr) => addToAllowlist('transactionAllowlist', type, addr)}
                                            onRemoveAddress={(type, idx) => removeFromAllowlist('transactionAllowlist', type, idx)}
                                        />

                                        {/* Fee Manager Allowlist */}
                                        <AllowlistSection
                                            title="Fee Manager"
                                            description="Control who can modify fee parameters"
                                            config={formData.feeManagerAllowlist}
                                            onToggle={(enabled) => updateNestedField('feeManagerAllowlist', 'enabled', enabled)}
                                            onAddAddress={(type, addr) => addToAllowlist('feeManagerAllowlist', type, addr)}
                                            onRemoveAddress={(type, idx) => removeFromAllowlist('feeManagerAllowlist', type, idx)}
                                        />
                                    </div>
                                )}

                                {/* Step 4: Pre-deploys */}
                                {currentStep === 4 && (
                                    <div className="space-y-4">
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Select contracts to pre-deploy at genesis
                                        </p>

                                        {predeployOptions.map((option) => (
                                            <div
                                                key={option.id}
                                                className="flex items-center justify-between p-4 bg-card border border-border rounded-lg"
                                            >
                                                <div>
                                                    <Label>{option.name}</Label>
                                                    <p className="text-xs text-muted-foreground">{option.desc}</p>
                                                </div>
                                                <Switch
                                                    checked={formData.predeploys[option.id as keyof typeof formData.predeploys]}
                                                    onCheckedChange={(checked) =>
                                                        updateNestedField('predeploys', option.id, checked)
                                                    }
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer Navigation */}
                            <div className="p-6 border-t border-border flex items-center justify-between bg-card z-10 shrink-0">
                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentStep(prev => prev - 1)}
                                    disabled={!canGoBack}
                                >
                                    <ChevronLeft className="w-4 h-4 mr-1" />
                                    Back
                                </Button>

                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                                        Cancel
                                    </Button>

                                    {isLastStep ? (
                                        <Button onClick={handleCreate} disabled={creating}>
                                            {creating ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Creating...
                                                </>
                                            ) : (
                                                <>
                                                    <Zap className="w-4 h-4 mr-2" />
                                                    Create Chain
                                                </>
                                            )}
                                        </Button>
                                    ) : (
                                        <Button onClick={() => setCurrentStep(prev => prev + 1)}>
                                            Next
                                            <ChevronRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Side - Genesis Preview */}
                        <div className="w-1/2 flex flex-col bg-muted/30">
                            <div className="p-6 flex-1 overflow-hidden">
                                <GenesisPreviewPanel formData={formData} className="h-full" />
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog >
        </>
    );
}

// Allowlist Section Component
interface AllowlistSectionProps {
    title: string;
    description: string;
    config: {
        enabled: boolean;
        adminAddresses: string[];
        managerAddresses: string[];
        enabledAddresses: string[];
    };
    onToggle: (enabled: boolean) => void;
    onAddAddress: (type: 'adminAddresses' | 'managerAddresses' | 'enabledAddresses', address: string) => void;
    onRemoveAddress: (type: 'adminAddresses' | 'managerAddresses' | 'enabledAddresses', index: number) => void;
}

function AllowlistSection({
    title,
    description,
    config,
    onToggle,
    onAddAddress,
    onRemoveAddress,
}: AllowlistSectionProps) {
    const [newAddress, setNewAddress] = useState('');

    return (
        <div className="border border-border rounded-lg overflow-hidden">
            <div
                className="flex items-center justify-between p-4 bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={(e) => {
                    // Prevent double-toggling if clicking directly on the switch
                    if ((e.target as HTMLElement).closest('[role="switch"]')) return;
                    onToggle(!config.enabled);
                }}
            >
                <div>
                    <Label className="cursor-pointer">{title}</Label>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <Switch checked={config.enabled} onCheckedChange={onToggle} />
            </div>

            {config.enabled && (
                <div className="p-4 space-y-4">
                    {/* Admin Addresses */}
                    <AddressList
                        title="Admin Addresses"
                        addresses={config.adminAddresses}
                        onAdd={(addr) => onAddAddress('adminAddresses', addr)}
                        onRemove={(idx) => onRemoveAddress('adminAddresses', idx)}
                    />

                    {/* Manager Addresses */}
                    <AddressList
                        title="Manager Addresses"
                        addresses={config.managerAddresses}
                        onAdd={(addr) => onAddAddress('managerAddresses', addr)}
                        onRemove={(idx) => onRemoveAddress('managerAddresses', idx)}
                    />

                    {/* Enabled Addresses */}
                    <AddressList
                        title="Enabled Addresses"
                        addresses={config.enabledAddresses}
                        onAdd={(addr) => onAddAddress('enabledAddresses', addr)}
                        onRemove={(idx) => onRemoveAddress('enabledAddresses', idx)}
                    />
                </div>
            )}
        </div>
    );
}

// Address List Component
interface AddressListProps {
    title: string;
    addresses: string[];
    onAdd: (address: string) => void;
    onRemove: (index: number) => void;
}

function AddressList({ title, addresses, onAdd, onRemove }: AddressListProps) {
    const [input, setInput] = useState('');

    const handleAdd = () => {
        if (input.trim()) {
            onAdd(input.trim());
            setInput('');
        }
    };

    return (
        <div className="space-y-2">
            <Label className="text-xs">{title}</Label>

            {addresses.map((addr, idx) => (
                <div key={idx} className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-muted px-2 py-1 rounded truncate">
                        {addr}
                    </code>
                    <Button variant="ghost" size="sm" onClick={() => onRemove(idx)}>
                        <Trash2 className="w-3 h-3 text-red-500" />
                    </Button>
                </div>
            ))}

            <div className="flex items-center gap-2">
                <Input
                    placeholder="0x..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 text-xs"
                    size={1}
                />
                <Button variant="outline" size="sm" onClick={handleAdd}>
                    Add
                </Button>
                <Button variant="outline" size="sm">
                    <Wallet className="w-3 h-3" />
                </Button>
            </div>
        </div>
    );
}
