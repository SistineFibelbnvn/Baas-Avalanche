'use client';

import { useState } from 'react';
import { Zap, Settings, ArrowRight, Loader2, Sparkles, Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useNetwork } from '@/context/NetworkContext';

interface SimpleSubnetWizardProps {
    onComplete?: () => void;
    onAdvanced?: () => void;
}

export function SimpleSubnetWizard({ onComplete, onAdvanced }: SimpleSubnetWizardProps) {
    const { refreshNetworks } = useNetwork();

    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<'select' | 'simple' | 'advanced'>('select');
    const [creating, setCreating] = useState(false);
    const [step, setStep] = useState(0);

    // Simple form - just name!
    const [chainName, setChainName] = useState('');
    const [tokenSymbol, setTokenSymbol] = useState('');

    // Success state
    const [success, setSuccess] = useState(false);
    const [createdChain, setCreatedChain] = useState<any>(null);

    const resetAndClose = () => {
        setIsOpen(false);
        setMode('select');
        setStep(0);
        setChainName('');
        setTokenSymbol('');
        setSuccess(false);
        setCreatedChain(null);
    };

    // One-click create with defaults
    const handleQuickCreate = async () => {
        const name = chainName.trim() || `MyChain-${Date.now()}`;
        const symbol = tokenSymbol.trim() || 'TOKEN';

        setCreating(true);
        try {
            const result = await api.subnets.create({
                name,
                vmType: 'subnet-evm',
                tokenSymbol: symbol,
                validatorType: 'poa',
                enableICM: true,
            });

            setCreatedChain(result);
            setSuccess(true);
            refreshNetworks();

            toast.success('🎉 Blockchain is being created!', {
                description: 'This process takes about 1-2 minutes.',
            });
        } catch (error) {
            toast.error('Failed to create blockchain', {
                description: (error as Error).message,
            });
        } finally {
            setCreating(false);
        }
    };

    return (
        <>
            {/* Main Button */}
            <Button
                onClick={() => setIsOpen(true)}
                size="lg"
                className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
                <Sparkles className="w-5 h-5" />
                Create New Blockchain
            </Button>

            <Dialog open={isOpen} onOpenChange={resetAndClose}>
                <DialogContent className="max-w-lg">
                    {/* Mode Selection */}
                    {mode === 'select' && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-xl text-center">
                                    Create Your Own Layer 1 Blockchain
                                </DialogTitle>
                                <DialogDescription className="text-center">
                                    Choose how you want to start
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 mt-6">
                                {/* Quick Mode */}
                                <button
                                    onClick={() => setMode('simple')}
                                    className="w-full p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                                            <Zap className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                                Quick Create
                                                <span className="text-xs px-2 py-0.5 bg-green-500/10 text-green-600 rounded-full">
                                                    Recommended
                                                </span>
                                            </h3>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Just name it, everything else is automated.
                                                Perfect for beginners.
                                            </p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                </button>

                                {/* Advanced Mode */}
                                <button
                                    onClick={() => {
                                        resetAndClose();
                                        if (onAdvanced) {
                                            onAdvanced();
                                        } else {
                                            toast.info("Advanced mode is available in the Subnets tab");
                                        }
                                    }}
                                    className="w-full p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                                            <Settings className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-lg">Advanced Customization</h3>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Detailed config: tokenomics, gas fees, permissions, pre-deploys.
                                            </p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                </button>
                            </div>
                        </>
                    )}

                    {/* Simple Mode - Just name your chain! */}
                    {mode === 'simple' && !success && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-green-500" />
                                    Quick Create Blockchain
                                </DialogTitle>
                                <DialogDescription>
                                    Just give it a name, we handle the rest!
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6 mt-6">
                                <div>
                                    <Label htmlFor="chainName" className="text-base">
                                        Your Blockchain Name
                                    </Label>
                                    <Input
                                        id="chainName"
                                        placeholder="Ex: MyGameChain, DeFiNetwork..."
                                        value={chainName}
                                        onChange={(e) => setChainName(e.target.value)}
                                        className="mt-2 text-lg h-12"
                                        autoFocus
                                    />
                                    <p className="text-xs text-muted-foreground mt-2">
                                        💡 This is the display name. Leave empty to auto-generate.
                                    </p>
                                </div>

                                <div>
                                    <Label htmlFor="tokenSymbol" className="text-base">
                                        Token Symbol (Optional)
                                    </Label>
                                    <Input
                                        id="tokenSymbol"
                                        placeholder="Ex: GAME, DEFI, TOKEN..."
                                        value={tokenSymbol}
                                        onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
                                        className="mt-2"
                                        maxLength={10}
                                    />
                                    <p className="text-xs text-muted-foreground mt-2">
                                        💡 This is the native token symbol (like ETH, AVAX). Default: TOKEN
                                    </p>
                                </div>

                                {/* What you get */}
                                <div className="bg-muted/50 rounded-lg p-4">
                                    <p className="text-sm font-medium mb-3">You will get:</p>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        <li className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-green-500" />
                                            EVM Compatible Blockchain (Smart Contracts ready)
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-green-500" />
                                            MetaMask & Ethereum Tools support
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-green-500" />
                                            Interchain Messaging (ICM) enabled
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-green-500" />
                                            Full Management Dashboard
                                        </li>
                                    </ul>
                                </div>

                                <div className="flex gap-3">
                                    <Button variant="outline" onClick={() => setMode('select')} className="flex-1">
                                        Back
                                    </Button>
                                    <Button
                                        onClick={handleQuickCreate}
                                        disabled={creating}
                                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                    >
                                        {creating ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <Zap className="w-4 h-4 mr-2" />
                                                Create Blockchain
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Success State */}
                    {success && (
                        <>
                            <div className="text-center py-6">
                                <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                                    <Check className="w-10 h-10 text-green-500" />
                                </div>

                                <h2 className="text-2xl font-bold mb-2">
                                    🎉 Blockchain is being created!
                                </h2>
                                <p className="text-muted-foreground">
                                    This process takes about 1-2 minutes.
                                </p>

                                {createdChain && (
                                    <div className="mt-6 p-4 bg-muted rounded-lg text-left">
                                        <p className="text-sm font-medium mb-2">Details:</p>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Name:</span>
                                                <span>{createdChain.name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">ID:</span>
                                                <code className="text-xs">{createdChain.id}</code>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-6 space-y-3">
                                    <Button onClick={resetAndClose} className="w-full">
                                        View in Dashboard
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSuccess(false);
                                            setChainName('');
                                            setTokenSymbol('');
                                        }}
                                        className="w-full"
                                    >
                                        Create another blockchain
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
