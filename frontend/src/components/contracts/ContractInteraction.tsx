"use client";

import { useState } from "react";
import { Play, Eye, Terminal, Loader2, ArrowRight, Wallet } from "lucide-react";
import api from "@/lib/api";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface ContractInteractionProps {
    contractId: string;
    contractAddress: string;
    abi: any[];
    rpcUrl?: string;
}

export function ContractInteraction({ contractId, contractAddress, abi, rpcUrl }: ContractInteractionProps) {
    const [results, setResults] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState<string | null>(null);
    const [useWallet, setUseWallet] = useState(true); // Default: use MetaMask wallet

    // Identify functions from ABI
    const functions = abi.filter(item =>
        (typeof item === 'string' && item.startsWith('function')) ||
        (item.type === 'function')
    ).map(item => {
        if (typeof item === 'string') {
            const match = item.match(/function\s+(\w+)\(([^)]*)\)/);
            return {
                name: match ? match[1] : 'unknown',
                inputs: match ? match[2].split(',').filter(x => x).map((x, i) => ({
                    name: `param${i}`,
                    type: x.trim().split(' ')[0]
                })) : [],
                stateMutability: item.includes('view') || item.includes('pure') ? 'view' : 'nonpayable'
            };
        }
        return item;
    });

    const handleCall = async (funcName: string, type: 'view' | 'nonpayable', inputs: any[]) => {
        setLoading(funcName);
        try {
            const isView = type === 'view';

            if (isView) {
                // Read calls: always via backend (bypasses CORS, uses stored rpcUrl)
                const res = await api.contracts.read(contractId, funcName, inputs);
                const resultStr = typeof res === 'object' ? JSON.stringify(res, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2) : String(res);
                setResults(prev => ({ ...prev, [funcName]: resultStr }));
            } else if (useWallet && window.ethereum) {
                // Write via MetaMask wallet — ensure correct network
                const provider = new ethers.BrowserProvider(window.ethereum as any, "any");
                const signer = await provider.getSigner();

                // Soft check: verify wallet is on correct network (non-blocking if RPC unreachable)
                try {
                    const code = await provider.getCode(contractAddress);
                    if (code === '0x') {
                        toast.error('Contract not found on your wallet\'s current network. Please switch to the correct network in MetaMask.');
                        setResults(prev => ({ ...prev, [funcName]: 'Error: Contract not found on current wallet network. Switch network in MetaMask.' }));
                        return;
                    }
                } catch (checkErr) {
                    console.warn('Network check failed (continuing anyway):', checkErr);
                }

                const contract = new ethers.Contract(contractAddress, abi, signer);
                toast.info("Confirm transaction in your wallet...");
                const tx = await contract[funcName](...inputs);
                toast.info(`Transaction sent: ${tx.hash.slice(0, 10)}...`);

                const receipt = await tx.wait();
                setResults(prev => ({
                    ...prev,
                    [funcName]: JSON.stringify({
                        status: receipt.status === 1 ? 'Success' : 'Failed',
                        txHash: tx.hash,
                        blockNumber: receipt.blockNumber,
                        gasUsed: receipt.gasUsed.toString()
                    }, null, 2)
                }));
                toast.success(`Transaction confirmed: ${funcName}`);
            } else {
                // Write via backend (EWOQ key)
                const res = await api.contracts.write(contractId, funcName, inputs);
                const resultStr = typeof res === 'object' ? JSON.stringify(res, null, 2) : String(res);
                setResults(prev => ({ ...prev, [funcName]: resultStr }));
                toast.success(`Transaction sent: ${funcName}`);
            }
        } catch (e: any) {
            console.error(e);
            const errorMsg = e.reason || e.message || String(e);
            let displayMsg = errorMsg;
            if (e.code === 'CALL_EXCEPTION' || errorMsg.includes('missing revert data')) {
                displayMsg = 'Contract not found at this address. It may have been removed after a subnet reset, or your wallet is on the wrong network.';
            }
            setResults(prev => ({ ...prev, [funcName]: `Error: ${displayMsg}` }));
            toast.error(`Execution failed: ${displayMsg}`);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="space-y-4">
            {/* Execution mode toggle */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/40 border">
                <span className="text-xs text-muted-foreground font-medium">Write mode:</span>
                <Button
                    variant={useWallet ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setUseWallet(true)}
                >
                    <Wallet className="h-3 w-3 mr-1" />
                    MetaMask Wallet
                </Button>
                <Button
                    variant={!useWallet ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setUseWallet(false)}
                >
                    <Terminal className="h-3 w-3 mr-1" />
                    Backend (EWOQ)
                </Button>
            </div>

            <ScrollArea className="h-[450px] pr-4">
                <div className="space-y-4">
                    {functions.length === 0 && (
                        <div className="text-sm text-center text-muted-foreground py-8">
                            No callable functions found in ABI.
                        </div>
                    )}
                    {functions.map((func, idx) => {
                        const isView = func.stateMutability === 'view' || func.stateMutability === 'pure';

                        return (
                            <Card key={idx} className="overflow-hidden border-border/60">
                                <CardHeader className="p-4 bg-muted/40 flex flex-row items-center justify-between space-y-0">
                                    <div className="flex items-center gap-2">
                                        <Badge variant={isView ? "secondary" : "default"} className={isView ? "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20" : "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20"}>
                                            {isView ? <Eye className="h-3 w-3 mr-1" /> : <Play className="h-3 w-3 mr-1" />}
                                            {func.name}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">{func.stateMutability}</span>
                                        {!isView && (
                                            <Badge variant="outline" className="text-[9px] h-5">
                                                {useWallet ? '🦊 Wallet' : '🔑 Backend'}
                                            </Badge>
                                        )}
                                    </div>
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
                                            const args = (func.inputs || []).map((_: any, i: number) => {
                                                const el = document.getElementById(`input-${func.name}-${i}`) as HTMLInputElement;
                                                return el?.value || '';
                                            });
                                            handleCall(func.name, isView ? 'view' : 'nonpayable', args);
                                        }}
                                    >
                                        {loading === func.name ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : (isView ? <Eye className="h-3 w-3 mr-2" /> : <Play className="h-3 w-3 mr-2" />)}
                                        {loading === func.name ? "Executing..." : (isView ? "Read Data" : "Write Transaction")}
                                    </Button>

                                    {/* Result Display */}
                                    {results[func.name] && (
                                        <div className={`rounded-md border p-3 font-mono text-xs overflow-x-auto relative ${results[func.name].startsWith('Error')
                                            ? 'border-red-500/30 bg-red-950/20 text-red-400'
                                            : 'border-border bg-black/90 text-green-400'
                                            }`}>
                                            <div className="absolute top-2 right-2 text-[10px] text-slate-500">
                                                {results[func.name].startsWith('Error') ? 'ERROR' : 'RESULT'}
                                            </div>
                                            <pre className="whitespace-pre-wrap break-all">{results[func.name]}</pre>
                                        </div>
                                    )}
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
}
