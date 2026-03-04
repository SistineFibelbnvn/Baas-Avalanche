"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { ConnectWallet } from "./ConnectWallet";
import { FileCode, Rocket, RefreshCw, Box, Wifi, Code, Play, BookOpen, Layers, CheckCircle, ExternalLink, Copy, AlertTriangle } from "lucide-react";
import { useNetwork } from "@/context/NetworkContext";
import { ContractInteraction } from "./ContractInteraction";
import { CONTRACT_TEMPLATES } from "./ContractTemplates";
import api, { DeployedContract } from "@/lib/api";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Helper to create safe provider and polyfill missing listeners
function getSafeProvider(): ethers.BrowserProvider | null {
    if (typeof window === 'undefined' || !window.ethereum) return null;

    const eth = window.ethereum as any;
    if (!eth.addListener && eth.on) eth.addListener = eth.on.bind(eth);
    if (!eth.removeListener && eth.off) eth.removeListener = eth.off.bind(eth);

    return new ethers.BrowserProvider(eth, "any");
}

export function ContractStudio() {
    const { selectedNetwork, refreshNetworks } = useNetwork();
    const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
    const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
    const [account, setAccount] = useState<string | null>(null);
    const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
    const [walletChainId, setWalletChainId] = useState<number | null>(null);

    // Tabs: 'deploy', 'interact'
    const [activeTab, setActiveTab] = useState<'deploy' | 'interact'>('deploy');

    // Deploy State
    const [contractName, setContractName] = useState("");
    const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
    const [sourceCode, setSourceCode] = useState("");
    const [isDeploying, setIsDeploying] = useState(false);
    // Custom deploy
    const [deployMode, setDeployMode] = useState<'template' | 'custom'>('template');
    const [customAbi, setCustomAbi] = useState("");
    const [customBytecode, setCustomBytecode] = useState("");
    const [constructorArgs, setConstructorArgs] = useState("");

    // Interact State
    const [contracts, setContracts] = useState<DeployedContract[]>([]);
    const [selectedContractId, setSelectedContractId] = useState<string | null>(null);

    useEffect(() => {
        if (selectedNetwork) fetchContracts();
    }, [selectedNetwork]);

    useEffect(() => {
        checkNetwork();
    }, [provider, selectedNetwork]);

    // Auto-detect wallet + poll every 2s until connected (Header ConnectWallet sets wallet independently)
    useEffect(() => {
        const checkWalletConnection = async () => {
            if (typeof window !== 'undefined' && window.ethereum) {
                const eth = window.ethereum as any;
                if (!eth.addListener && eth.on) eth.addListener = eth.on.bind(eth);
                if (!eth.removeListener && eth.off) eth.removeListener = eth.off.bind(eth);
                try {
                    const prov = getSafeProvider();
                    if (!prov) return;
                    const accounts = await prov.listAccounts();
                    if (accounts.length > 0) {
                        const sig = await prov.getSigner();
                        const addr = accounts[0].address;
                        setProvider(prov);
                        setSigner(sig);
                        setAccount(addr);
                        refreshNetworks(addr);
                    }
                } catch (e) {
                    console.error("Wallet check failed", e);
                }
            }
        };
        checkWalletConnection();

        // Poll every 2s until signer is set (handles Header ConnectWallet timing)
        const poll = setInterval(() => {
            if (!signer) checkWalletConnection();
        }, 2000);

        const handleChainChanged = () => window.location.reload();
        if (typeof window !== 'undefined' && window.ethereum) {
            try {
                window.ethereum.on?.('accountsChanged', checkWalletConnection);
                window.ethereum.on?.('chainChanged', handleChainChanged);
            } catch (e) {
                console.warn('Failed to add ethereum event listeners', e);
            }
        }

        return () => {
            clearInterval(poll);
            if (typeof window !== 'undefined' && window.ethereum) {
                try {
                    window.ethereum.removeListener?.('accountsChanged', checkWalletConnection);
                    window.ethereum.removeListener?.('chainChanged', handleChainChanged);
                } catch (e) { }
            }
        };
    }, [signer]);

    // Manual connect fallback
    const handleManualConnect = async () => {
        if (!window.ethereum) return toast.error('No wallet found. Install MetaMask.');
        try {
            const prov = getSafeProvider();
            if (!prov) return;
            await prov.send('eth_requestAccounts', []);
            const sig = await prov.getSigner();
            const addr = await sig.getAddress();
            setProvider(prov);
            setSigner(sig);
            setAccount(addr);
            refreshNetworks(addr);
            toast.success(`Connected: ${addr.slice(0, 6)}...${addr.slice(-4)}`);
        } catch (e: any) {
            toast.error(e.message || 'Connection failed');
        }
    };

    const fetchContracts = async () => {
        if (!selectedNetwork) return;
        try {
            const allContracts = await api.contracts.list(selectedNetwork.id, account || undefined);
            // Client side filter fallback
            const filtered = allContracts.filter(c =>
                c.subnetId === selectedNetwork.id ||
                (c.chainId && String(c.chainId) === String(selectedNetwork.chainId))
            );
            setContracts(filtered);
            // If we have contracts and user is just landing, maybe auto switch? No, keep it predictable.
        } catch (e) {
            console.error("Failed to fetch contracts", e);
            toast.error("Failed to load contracts");
        }
    }

    useEffect(() => {
        fetchContracts();
    }, [selectedNetwork, account]);

    const checkNetwork = async () => {
        if (!provider || !selectedNetwork) {
            setIsCorrectNetwork(false);
            setWalletChainId(null);
            return;
        }
        try {
            const network = await provider.getNetwork();
            const currentChainId = Number(network.chainId);
            setWalletChainId(currentChainId);
            setIsCorrectNetwork(currentChainId === Number(selectedNetwork.chainId));
        } catch {
            setIsCorrectNetwork(false);
        }
    };

    const handleConnect = (prov: ethers.BrowserProvider, sig: ethers.JsonRpcSigner, addr: string) => {
        setProvider(prov);
        setSigner(sig);
        setAccount(addr);
    };

    const handleDeploy = async () => {
        if (!signer) return toast.error("Connect Wallet first!");

        let abi: any, bytecode: string;

        if (deployMode === 'custom') {
            // Custom deploy: user pasted ABI + bytecode
            if (!customAbi.trim() || !customBytecode.trim()) {
                return toast.error("Please provide both ABI and Bytecode");
            }
            try {
                abi = JSON.parse(customAbi.trim());
            } catch {
                return toast.error("Invalid ABI JSON format");
            }
            bytecode = customBytecode.trim();
            if (!bytecode.startsWith('0x')) bytecode = '0x' + bytecode;
        } else {
            // Template deploy
            if (selectedTemplate === null) {
                return toast.info("Please select a template or switch to Custom mode");
            }
            abi = CONTRACT_TEMPLATES[selectedTemplate].abi;
            bytecode = CONTRACT_TEMPLATES[selectedTemplate].bytecode;
            if (!abi || !bytecode) {
                return toast.error("This template requires compilation", {
                    description: "Compile in Remix IDE, then use Custom mode to paste ABI + Bytecode."
                });
            }
        }

        setIsDeploying(true);
        try {
            const factory = new ethers.ContractFactory(abi, bytecode, signer);

            // Parse constructor args if any
            let args: any[] = [];
            if (constructorArgs.trim()) {
                try {
                    args = JSON.parse(`[${constructorArgs.trim()}]`);
                } catch {
                    args = constructorArgs.split(',').map(a => a.trim()).filter(a => a);
                }
            }

            toast.info("Deploying...", { description: "Please confirm in your wallet" });
            const contract = await factory.deploy(...args);

            await contract.waitForDeployment();

            const address = await contract.getAddress();
            const txHash = contract.deploymentTransaction()?.hash;

            // Save to Backend
            await api.contracts.create({
                name: contractName || (selectedTemplate !== null ? CONTRACT_TEMPLATES[selectedTemplate].name : "CustomContract"),
                address,
                subnetId: selectedNetwork?.id || 'primary',
                abi,
                txHash: txHash || '',
                networkName: selectedNetwork?.name || 'Local',
                chainId: selectedNetwork?.chainId,
                rpcUrl: selectedNetwork?.directRpcUrl || selectedNetwork?.rpcUrl,
                bytecode: "",
                ownerAddress: account!
            } as any);

            toast.success(`Deployed at ${address.slice(0, 10)}...`);
            fetchContracts();
            setActiveTab('interact');
        } catch (e: any) {
            console.error(e);
            const msg = e.reason || e.message || String(e);
            toast.error("Deployment failed", { description: msg });
        } finally {
            setIsDeploying(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    const handleSwitchNetwork = async () => {
        if (!selectedNetwork) return;
        const chainIdHex = "0x" + Number(selectedNetwork.chainId).toString(16);

        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: chainIdHex }],
            });
            window.location.reload();
        } catch (e: any) {
            // Check for missing chain error (4902) or string match
            if (e.code === 4902 || e.message?.includes('Unrecognized chain ID')) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: chainIdHex,
                            chainName: selectedNetwork.name,
                            rpcUrls: [selectedNetwork.rpcUrl],
                            nativeCurrency: {
                                name: selectedNetwork.tokenSymbol || 'AVAX',
                                symbol: selectedNetwork.tokenSymbol || 'AVAX',
                                decimals: 18
                            }
                        }]
                    });
                    // Retry switch or just reload (reload usually forces re-check)
                    window.location.reload();
                } catch (addError: any) {
                    console.error(addError);
                    toast.error("Failed to add network", { description: addError.message });
                }
            } else {
                console.error(e);
                toast.error("Failed to switch network", { description: e.message });
            }
        }
    };

    const selectedContractData = contracts.find(c => c.id === selectedContractId);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Smart Contracts</h2>
                    <p className="text-sm text-muted-foreground mt-1">Deploy templates and interact with on-chain contracts</p>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={fetchContracts}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Network Warning */}
            {account && !isCorrectNetwork && selectedNetwork && (
                <Alert variant="destructive" className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        <div>
                            <AlertTitle>Wrong Network</AlertTitle>
                            <AlertDescription>
                                Please switch your wallet to <b>{selectedNetwork.name}</b> (Chain ID: {selectedNetwork.chainId}).
                                {walletChainId && <span className="block text-xs mt-1 opacity-80 font-mono">Current Wallet Chain: {walletChainId}</span>}
                            </AlertDescription>
                        </div>
                    </div>
                    <Button variant="default" size="sm" onClick={handleSwitchNetwork} className="ml-4">
                        Switch Network
                    </Button>
                </Alert>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Contracts</CardTitle>
                        <div className="text-2xl font-bold">{contracts.length}</div>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Deployed Today</CardTitle>
                        {/* Mock data for now */}
                        <div className="text-2xl font-bold">{
                            contracts.filter(c => c.deployedAt && new Date(c.deployedAt).toDateString() === new Date().toDateString()).length
                        }</div>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Network</CardTitle>
                        <div className="text-lg font-bold truncate">{selectedNetwork?.name || 'N/A'}</div>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Connected Wallet</CardTitle>
                        <div className="text-sm font-mono truncate">{account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Not connected'}</div>
                    </CardHeader>
                </Card>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <TabsList>
                    <TabsTrigger value="deploy">
                        <Rocket className="h-4 w-4 mr-2" /> Deploy
                    </TabsTrigger>
                    <TabsTrigger value="interact">
                        <Play className="h-4 w-4 mr-2" /> Interact
                    </TabsTrigger>
                </TabsList>

                {/* DEPLOY TAB */}
                <TabsContent value="deploy" className="mt-6 space-y-6">
                    {/* Mode toggle: Template / Custom */}
                    <div className="flex items-center gap-2 p-1 bg-muted rounded-lg w-fit">
                        <Button
                            variant={deployMode === 'template' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setDeployMode('template')}
                        >
                            <BookOpen className="h-4 w-4 mr-2" /> Templates
                        </Button>
                        <Button
                            variant={deployMode === 'custom' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setDeployMode('custom')}
                        >
                            <Code className="h-4 w-4 mr-2" /> Custom Contract
                        </Button>
                    </div>

                    {deployMode === 'template' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Templates List */}
                            <Card className="lg:col-span-1">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BookOpen className="h-5 w-5" /> Templates
                                    </CardTitle>
                                    <CardDescription>Select a starting point</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {CONTRACT_TEMPLATES.map((tpl, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => {
                                                setSelectedTemplate(idx);
                                                setSourceCode(tpl.source);
                                                setContractName(tpl.name);
                                            }}
                                            className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-muted ${selectedTemplate === idx
                                                ? 'border-primary ring-1 ring-primary bg-primary/5'
                                                : 'border-border'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-medium">{tpl.name}</span>
                                                {!tpl.bytecode && <Badge variant="outline" className="text-[9px] h-5">Needs Compile</Badge>}
                                            </div>
                                            <div className="text-xs text-muted-foreground">{tpl.description}</div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Config & Deploy */}
                            <Card className="lg:col-span-2 flex flex-col">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Code className="h-5 w-5" /> Contract Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 flex-1">
                                    <div className="space-y-2">
                                        <Label>Contract Name</Label>
                                        <Input
                                            value={contractName}
                                            onChange={e => setContractName(e.target.value)}
                                            placeholder="MyContract"
                                        />
                                    </div>
                                    <div className="space-y-2 flex-1 flex flex-col">
                                        <Label>Source Code Preview</Label>
                                        <div className="relative flex-1 min-h-[250px] border rounded-md bg-muted/50">
                                            <Textarea
                                                value={sourceCode}
                                                readOnly={true}
                                                className="absolute inset-0 w-full h-full font-mono text-xs resize-none border-0 bg-transparent p-4 focus-visible:ring-0"
                                                placeholder="// Select a template to view code..."
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Constructor Arguments <span className="text-muted-foreground text-xs">(comma-separated, optional)</span></Label>
                                        <Input
                                            value={constructorArgs}
                                            onChange={e => setConstructorArgs(e.target.value)}
                                            placeholder='e.g. 1000000, "MyToken"'
                                            className="font-mono text-sm"
                                        />
                                    </div>

                                    <Button className="w-full" size="lg" onClick={handleDeploy} disabled={isDeploying || !signer}>
                                        {isDeploying ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
                                        {isDeploying ? "Deploying..." : "Deploy to Network"}
                                    </Button>
                                    {!signer && (
                                        <Button variant="outline" className="w-full" onClick={handleManualConnect}>
                                            <Wifi className="mr-2 h-4 w-4" /> Connect Wallet to Deploy
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        /* CUSTOM DEPLOY MODE */
                        <Card className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Code className="h-5 w-5" /> Custom Contract Deploy
                                </CardTitle>
                                <CardDescription>Paste compiled ABI and Bytecode from Remix IDE, Hardhat, or Foundry</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Contract Name</Label>
                                    <Input
                                        value={contractName}
                                        onChange={e => setContractName(e.target.value)}
                                        placeholder="MyContract"
                                    />
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>ABI <span className="text-muted-foreground text-xs">(JSON array)</span></Label>
                                        <Textarea
                                            value={customAbi}
                                            onChange={e => setCustomAbi(e.target.value)}
                                            placeholder='[{"inputs":[],"name":"myFunc","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"}]'
                                            className="font-mono text-xs min-h-[200px]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Bytecode <span className="text-muted-foreground text-xs">(hex, with or without 0x)</span></Label>
                                        <Textarea
                                            value={customBytecode}
                                            onChange={e => setCustomBytecode(e.target.value)}
                                            placeholder="0x608060405234801561001057600080fd5b50..."
                                            className="font-mono text-xs min-h-[200px]"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Constructor Arguments <span className="text-muted-foreground text-xs">(comma-separated, optional)</span></Label>
                                    <Input
                                        value={constructorArgs}
                                        onChange={e => setConstructorArgs(e.target.value)}
                                        placeholder='e.g. 1000000, "0xabc...", "TokenName"'
                                        className="font-mono text-sm"
                                    />
                                </div>
                                <Alert>
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>How to get ABI & Bytecode</AlertTitle>
                                    <AlertDescription className="text-xs">
                                        1. Open <a href="https://remix.ethereum.org" target="_blank" className="underline text-primary">Remix IDE</a><br />
                                        2. Write/paste your Solidity contract<br />
                                        3. Compile → Copy ABI from "Compilation Details"<br />
                                        4. Copy Bytecode (object field) from "Compilation Details"<br />
                                        5. Paste both here and deploy!
                                    </AlertDescription>
                                </Alert>
                                <Button className="w-full" size="lg" onClick={handleDeploy} disabled={isDeploying || !signer}>
                                    {isDeploying ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
                                    {isDeploying ? "Deploying..." : "Deploy Custom Contract"}
                                </Button>
                                {!signer && (
                                    <Button variant="outline" className="w-full" onClick={handleManualConnect}>
                                        <Wifi className="mr-2 h-4 w-4" /> Connect Wallet to Deploy
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* INTERACT TAB */}
                <TabsContent value="interact" className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Contract List */}
                        <Card className="lg:col-span-1 h-[600px] flex flex-col">
                            <CardHeader className="pb-3">
                                <CardTitle>Contracts</CardTitle>
                                <CardDescription>Deployed on {selectedNetwork?.name}</CardDescription>
                            </CardHeader>
                            <ScrollArea className="flex-1">
                                <div className="px-4 pb-4 space-y-2">
                                    {contracts.length === 0 && (
                                        <div className="text-sm text-center text-muted-foreground py-8">
                                            No contracts found.
                                        </div>
                                    )}
                                    {contracts.map(c => (
                                        <div
                                            key={c.id}
                                            onClick={() => setSelectedContractId(c.id)}
                                            className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted ${selectedContractId === c.id
                                                ? 'bg-primary/10 border-primary'
                                                : 'bg-card border-border'
                                                }`}
                                        >
                                            <div className="font-medium flex items-center gap-2">
                                                <Box className="h-3 w-3 text-primary" />
                                                {c.name}
                                            </div>
                                            <div className="text-xs font-mono text-muted-foreground truncate mt-1 flex items-center gap-1">
                                                {c.address.slice(0, 10)}...{c.address.slice(-4)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </Card>

                        {/* Interface Panel */}
                        <div className="lg:col-span-3">
                            {selectedContractData ? (
                                <Card className="h-full border-primary/20 bg-card/60">
                                    <CardHeader className="border-b">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-xl flex items-center gap-2">
                                                    {selectedContractData.name}
                                                    <Badge variant="secondary" className="font-normal text-xs">
                                                        Active
                                                    </Badge>
                                                </CardTitle>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                                    <span className="font-mono bg-muted px-2 py-0.5 rounded">
                                                        {selectedContractData.address}
                                                    </span>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(selectedContractData.address)}>
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="hidden md:flex flex-col items-end gap-1 text-xs text-muted-foreground">
                                                <span>Tx: {selectedContractData.txHash?.slice(0, 10)}...</span>
                                                <span>{selectedContractData.deployedAt ? new Date(selectedContractData.deployedAt).toLocaleString() : 'N/A'}</span>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <ContractInteraction
                                            contractId={selectedContractData.id}
                                            contractAddress={selectedContractData.address}
                                            abi={selectedContractData.abi}
                                            rpcUrl={selectedNetwork?.directRpcUrl || selectedNetwork?.rpcUrl}
                                        />
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card className="h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/10 border-dashed min-h-[400px]">
                                    <Layers className="h-12 w-12 mb-4 opacity-50" />
                                    <p>Select a contract to interact with</p>
                                    <Button variant="link" onClick={() => setActiveTab('deploy')}>
                                        Or deploy a new one
                                    </Button>
                                </Card>
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
