"use client";

import { useState, useEffect } from "react";
import { useNetwork } from "@/context/NetworkContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { Droplets, Wallet, RefreshCw, CheckCircle2, Copy, ArrowRight, Info, Coins } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface FundResult {
    success: boolean;
    txHash?: string;
    amount?: string;
    address?: string;
    network?: string;
    previousBalance?: string;
    newBalance?: string;
    faucetAddress?: string;
    error?: string;
}

export function FaucetView() {
    const { selectedNetwork, networks } = useNetwork();
    const [address, setAddress] = useState("");
    const [amount, setAmount] = useState("10");
    const [networkId, setNetworkId] = useState<string>("");
    const [isFunding, setIsFunding] = useState(false);
    const [result, setResult] = useState<FundResult | null>(null);
    const [balance, setBalance] = useState<string | null>(null);
    const [isCheckingBalance, setIsCheckingBalance] = useState(false);

    // Set default network
    useEffect(() => {
        if (selectedNetwork) {
            setNetworkId(selectedNetwork.id);
        }
    }, [selectedNetwork]);

    const getSelectedNetworkInfo = () => {
        return networks?.find((n: any) => n.id === networkId);
    };

    const getRpcUrl = () => {
        const net = getSelectedNetworkInfo();
        if (net?.directRpcUrl) return net.directRpcUrl;
        if (net?.rpcUrl) return net.rpcUrl;
        return 'http://127.0.0.1:9650/ext/bc/C/rpc';
    };

    const handleFund = async () => {
        if (!address.trim()) {
            return toast.error("Please enter a wallet address");
        }

        if (!/^0x[a-fA-F0-9]{40}$/.test(address.trim())) {
            return toast.error("Invalid Ethereum address format");
        }

        setIsFunding(true);
        setResult(null);

        try {
            const net = getSelectedNetworkInfo();
            const res = await fetch(`${API_BASE}/faucet/fund`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address: address.trim(),
                    amount,
                    rpcUrl: getRpcUrl(),
                    networkName: net?.name || 'C-Chain',
                }),
            });
            const data = await res.json();
            setResult(data);

            if (data.success) {
                toast.success(`Sent ${data.amount} tokens!`, {
                    description: `Balance: ${data.previousBalance} → ${data.newBalance}`
                });
                setBalance(data.newBalance);
            } else {
                toast.error("Faucet failed", { description: data.error });
            }
        } catch (e: any) {
            toast.error("Request failed", { description: e.message });
        } finally {
            setIsFunding(false);
        }
    };

    const checkBalance = async () => {
        if (!address.trim()) return;

        setIsCheckingBalance(true);
        try {
            const res = await fetch(`${API_BASE}/faucet/balance?address=${address.trim()}&rpcUrl=${encodeURIComponent(getRpcUrl())}`);
            const data = await res.json();
            if (data.success) {
                setBalance(data.balance);
            } else {
                toast.error("Balance check failed", { description: data.error });
            }
        } catch (e: any) {
            toast.error("Failed to check balance");
        } finally {
            setIsCheckingBalance(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied!");
    };

    const pasteFromClipboard = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (/^0x[a-fA-F0-9]{40}$/.test(text.trim())) {
                setAddress(text.trim());
                toast.success("Address pasted!");
            } else {
                toast.error("Clipboard doesn't contain a valid address");
            }
        } catch {
            toast.error("Cannot access clipboard");
        }
    };

    const presetAmounts = ["1", "5", "10", "50", "100"];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                            <Droplets className="h-6 w-6 text-white" />
                        </div>
                        Test Token Faucet
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Get free test tokens for development on any network
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Faucet Card */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Coins className="h-5 w-5" /> Request Tokens
                        </CardTitle>
                        <CardDescription>
                            Tokens are sent from the EWOQ key (pre-funded on all local networks)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {/* Network Selector */}
                        <div className="space-y-2">
                            <Label>Network</Label>
                            <Select value={networkId} onValueChange={setNetworkId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select network" />
                                </SelectTrigger>
                                <SelectContent>
                                    {networks?.map((net: any) => (
                                        <SelectItem key={net.id} value={net.id}>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${net.status === 'running' ? 'bg-green-500' : 'bg-gray-400'}`} />
                                                {net.name}
                                                {net.chainId && <span className="text-muted-foreground text-xs">#{net.chainId}</span>}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Address Input */}
                        <div className="space-y-2">
                            <Label>Recipient Address</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                    placeholder="0x..."
                                    className="font-mono text-sm"
                                />
                                <Button variant="outline" size="icon" onClick={pasteFromClipboard} title="Paste from clipboard">
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Amount */}
                        <div className="space-y-2">
                            <Label>Amount (tokens)</Label>
                            <div className="flex gap-2 items-center">
                                <Input
                                    type="number"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    min="0.01"
                                    step="1"
                                    className="w-32"
                                />
                                <div className="flex gap-1">
                                    {presetAmounts.map(a => (
                                        <Button
                                            key={a}
                                            variant={amount === a ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setAmount(a)}
                                            className="text-xs"
                                        >
                                            {a}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Balance Check */}
                        {address && (
                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                <Wallet className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Current Balance:</span>
                                {balance !== null ? (
                                    <span className="text-sm font-mono font-medium">{balance} tokens</span>
                                ) : (
                                    <Button variant="ghost" size="sm" onClick={checkBalance} disabled={isCheckingBalance} className="text-xs">
                                        {isCheckingBalance ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : null}
                                        Check Balance
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Fund Button */}
                        <Button
                            className="w-full"
                            size="lg"
                            onClick={handleFund}
                            disabled={isFunding || !address.trim()}
                        >
                            {isFunding ? (
                                <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                            ) : (
                                <><Droplets className="mr-2 h-4 w-4" /> Send {amount} Test Tokens</>
                            )}
                        </Button>

                        {/* Result */}
                        {result && (
                            <Alert variant={result.success ? 'default' : 'destructive'}>
                                {result.success ? <CheckCircle2 className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                                <AlertTitle>{result.success ? 'Tokens Sent!' : 'Failed'}</AlertTitle>
                                <AlertDescription>
                                    {result.success ? (
                                        <div className="space-y-2 mt-2">
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-muted-foreground">Balance:</span>
                                                <span className="font-mono">{result.previousBalance}</span>
                                                <ArrowRight className="h-3 w-3" />
                                                <span className="font-mono font-bold text-green-600">{result.newBalance}</span>
                                            </div>
                                            {result.txHash && (
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="text-muted-foreground">TX:</span>
                                                    <code className="font-mono bg-muted px-2 py-0.5 rounded">
                                                        {result.txHash.slice(0, 20)}...
                                                    </code>
                                                    <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => copyToClipboard(result.txHash!)}>
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-sm">{result.error}</span>
                                    )}
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {/* Info Card */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Info className="h-4 w-4" /> How It Works
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-muted-foreground">
                            <div className="flex items-start gap-2">
                                <Badge variant="secondary" className="mt-0.5 shrink-0">1</Badge>
                                <span>Select the network you want tokens on</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <Badge variant="secondary" className="mt-0.5 shrink-0">2</Badge>
                                <span>Enter your wallet address (MetaMask, etc.)</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <Badge variant="secondary" className="mt-0.5 shrink-0">3</Badge>
                                <span>Choose amount and click Send</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <Badge variant="secondary" className="mt-0.5 shrink-0">4</Badge>
                                <span>Tokens arrive instantly in your wallet</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Wallet className="h-4 w-4" /> Faucet Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-xs">
                            <div>
                                <span className="text-muted-foreground">Source:</span>
                                <div className="font-mono text-[11px] mt-1 bg-muted p-2 rounded break-all">
                                    0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC
                                </div>
                                <span className="text-muted-foreground">(EWOQ Key — pre-funded on all local nets)</span>
                            </div>
                            <div className="pt-2 flex justify-between">
                                <span className="text-muted-foreground">Default amount:</span>
                                <span>10 tokens</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Cooldown:</span>
                                <span>10 seconds</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Gas limit:</span>
                                <span>21,000</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
