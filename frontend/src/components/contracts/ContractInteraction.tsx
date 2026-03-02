"use client";

import { useState } from "react";
import { Play, Eye, Terminal, Loader2, ArrowRight } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface ContractInteractionProps {
    contractId: string;
    abi: any[];
}

export function ContractInteraction({ contractId, abi }: ContractInteractionProps) {
    const [results, setResults] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState<string | null>(null);

    // Identify functions from ABI
    const functions = abi.filter(item =>
        (typeof item === 'string' && item.startsWith('function')) ||
        (item.type === 'function')
    ).map(item => {
        if (typeof item === 'string') {
            // Parse string ABI (very basic)
            const match = item.match(/function\s+(\w+)\(([^)]*)\)/);
            return {
                name: match ? match[1] : 'unknown',
                inputs: match ? match[2].split(',').filter(x => x).map(x => x.trim()) : [],
                type: item.includes('view') || item.includes('pure') ? 'view' : 'nonpayable'
            };
        }
        return item;
    });

    const handleCall = async (funcName: string, type: 'view' | 'nonpayable', inputs: any[]) => {
        setLoading(funcName);
        try {
            let res;
            if (type === 'view') {
                res = await api.contracts.read(contractId, funcName, inputs);
            } else {
                res = await api.contracts.write(contractId, funcName, inputs);
            }
            const resultStr = typeof res === 'object' ? JSON.stringify(res, null, 2) : String(res);
            setResults(prev => ({ ...prev, [funcName]: resultStr }));

            if (type !== 'view') {
                toast.success(`Transaction sent: ${funcName}`);
            }
        } catch (e: any) {
            console.error(e);
            setResults(prev => ({ ...prev, [funcName]: `Error: ${e.message}` }));
            toast.error(`Execution failed: ${e.message}`);
        } finally {
            setLoading(null);
        }
    };

    return (
        <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
                {functions.map((func, idx) => {
                    const isView = func.stateMutability === 'view' || func.stateMutability === 'pure' || func.type === 'view';

                    return (
                        <Card key={idx} className="overflow-hidden border-border/60">
                            <CardHeader className="p-4 bg-muted/40 flex flex-row items-center justify-between space-y-0">
                                <div className="flex items-center gap-2">
                                    <Badge variant={isView ? "secondary" : "default"} className={isView ? "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20" : "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20"}>
                                        {isView ? <Eye className="h-3 w-3 mr-1" /> : <Play className="h-3 w-3 mr-1" />}
                                        {func.name}
                                    </Badge>
                                </div>
                                <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">{func.stateMutability || func.type}</span>
                            </CardHeader>
                            <CardContent className="p-4 space-y-3">
                                {/* Inputs */}
                                {func.inputs && func.inputs.length > 0 ? (
                                    <div className="grid gap-3">
                                        {func.inputs.map((input: any, i: number) => (
                                            <div key={i}>
                                                <label className="text-xs font-medium text-muted-foreground mb-1 block pl-1">
                                                    {input.name || `Param ${i + 1}`} <span className="text-muted-foreground/50">({input.type})</span>
                                                </label>
                                                <Input
                                                    id={`input-${func.name}-${i}`}
                                                    placeholder={input.type}
                                                    className="font-mono text-sm"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-xs text-muted-foreground italic pl-1">No arguments required</div>
                                )}
                            </CardContent>
                            <CardFooter className="p-3 bg-muted/20 flex flex-col items-stretch gap-3">
                                <Button
                                    size="sm"
                                    variant={isView ? "secondary" : "default"}
                                    className="w-full"
                                    disabled={loading === func.name}
                                    onClick={() => {
                                        const args = func.inputs.map((_: any, i: number) => {
                                            const el = document.getElementById(`input-${func.name}-${i}`) as HTMLInputElement;
                                            return el?.value;
                                        });
                                        handleCall(func.name, isView ? 'view' : 'nonpayable', args);
                                    }}
                                >
                                    {loading === func.name ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : (isView ? <Eye className="h-3 w-3 mr-2" /> : <Play className="h-3 w-3 mr-2" />)}
                                    {loading === func.name ? "Executing..." : (isView ? "Read Data" : "Write Transaction")}
                                </Button>

                                {/* Result Display */}
                                {results[func.name] && (
                                    <div className="rounded-md border border-border bg-black/90 p-3 font-mono text-xs overflow-x-auto text-green-400 relative">
                                        <div className="absolute top-2 right-2 text-[10px] text-slate-500">JSON</div>
                                        <pre>{results[func.name]}</pre>
                                    </div>
                                )}
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </ScrollArea>
    );
}
