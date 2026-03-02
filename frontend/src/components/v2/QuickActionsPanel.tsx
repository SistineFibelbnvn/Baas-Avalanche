'use client';

import { ArrowRight, Plus, Activity, Shield, FileCode, Settings, Zap, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/components/ui/utils';

interface QuickAction {
    id: string;
    title: string;
    description: string;
    icon: React.ElementType;
    color: string;
    action: () => void;
}

interface QuickActionsProps {
    onNavigate: (view: string) => void;
    onCreateChain?: () => void;
}

export function QuickActionsPanel({ onNavigate, onCreateChain }: QuickActionsProps) {
    const actions: QuickAction[] = [
        {
            id: 'create',
            title: 'Create New Blockchain',
            description: 'Launch your own Layer 1 blockchain',
            icon: Plus,
            color: 'from-blue-500 to-purple-600',
            action: () => onNavigate('subnets'),
        },
        {
            id: 'monitor',
            title: 'System Monitoring',
            description: 'View metrics, logs, and node status',
            icon: Activity,
            color: 'from-green-500 to-emerald-600',
            action: () => onNavigate('monitoring'),
        },
        {
            id: 'validators',
            title: 'Manage Validators',
            description: 'Add, remove, and track validators',
            icon: Shield,
            color: 'from-purple-500 to-indigo-600',
            action: () => onNavigate('validators'),
        },
        {
            id: 'contracts',
            title: 'Deploy Smart Contracts',
            description: 'Deploy contracts to your blockchain',
            icon: FileCode,
            color: 'from-orange-500 to-red-600',
            action: () => onNavigate('contracts'),
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Quick Start</h3>
                    <p className="text-sm text-muted-foreground">
                        Common actions to manage your blockchain
                    </p>
                </div>
                <Button variant="ghost" size="sm" className="gap-1">
                    <HelpCircle className="w-4 h-4" />
                    Guide
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {actions.map((action) => {
                    const Icon = action.icon;
                    return (
                        <button
                            key={action.id}
                            onClick={action.action}
                            className={cn(
                                'relative overflow-hidden rounded-xl p-5 text-left',
                                'bg-card border border-border hover:border-primary/50',
                                'transition-all duration-300 hover:shadow-lg hover:-translate-y-1',
                                'group'
                            )}
                        >
                            {/* Gradient background on hover */}
                            <div className={cn(
                                'absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity',
                                'bg-gradient-to-br',
                                action.color
                            )} />

                            {/* Icon */}
                            <div className={cn(
                                'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
                                'bg-gradient-to-br',
                                action.color
                            )}>
                                <Icon className="w-6 h-6 text-white" />
                            </div>

                            {/* Content */}
                            <h4 className="font-medium mb-1 group-hover:text-primary transition-colors">
                                {action.title}
                            </h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                                {action.description}
                            </p>

                            {/* Arrow */}
                            <ArrowRight className="absolute bottom-5 right-5 w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0" />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// Getting Started Guide for new users
export function GettingStartedGuide({ onNavigate }: { onNavigate: (view: string) => void }) {
    const steps = [
        {
            number: 1,
            title: 'Create Blockchain',
            description: 'Set a name, auto-configure system',
            action: 'subnets',
            done: false,
        },
        {
            number: 2,
            title: 'Connect Wallet',
            description: 'Add blockchain to MetaMask',
            action: 'subnets',
            done: false,
        },
        {
            number: 3,
            title: 'Deploy Contracts',
            description: 'Deploy your first smart contracts',
            action: 'contracts',
            done: false,
        },
        {
            number: 4,
            title: 'Monitoring',
            description: 'Track activity and performance',
            action: 'monitoring',
            done: false,
        },
    ];

    return (
        <div className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h3 className="font-semibold">Start with BaaS Console</h3>
                    <p className="text-sm text-muted-foreground">
                        4 simple steps to your own blockchain
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {steps.map((step, idx) => (
                    <button
                        key={step.number}
                        onClick={() => onNavigate(step.action)}
                        className={cn(
                            'relative p-4 rounded-lg border text-left transition-all',
                            step.done
                                ? 'bg-green-500/10 border-green-500/30'
                                : 'bg-card border-border hover:border-primary/50'
                        )}
                    >
                        <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center mb-3',
                            step.done ? 'bg-green-500 text-white' : 'bg-muted text-foreground'
                        )}>
                            {step.number}
                        </div>
                        <h4 className="font-medium text-sm mb-1">{step.title}</h4>
                        <p className="text-xs text-muted-foreground">{step.description}</p>

                        {idx < steps.length - 1 && (
                            <ArrowRight className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground hidden md:block" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
