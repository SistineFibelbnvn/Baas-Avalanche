"use client";

import { useState, useEffect } from 'react';
import { Wallet, LogOut, ChevronDown } from 'lucide-react';
import { ethers } from 'ethers';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

declare global {
    interface Window {
        ethereum: any;
        avalanche?: any;
    }
}

interface ConnectWalletProps {
    onConnect?: (provider: ethers.BrowserProvider, signer: ethers.JsonRpcSigner, address: string) => void;
}

// Helper to create safe provider and polyfill missing listeners (fixes MetaMask/Core conflicts)
function getSafeProvider(): ethers.BrowserProvider | null {
    if (typeof window === 'undefined' || !window.ethereum) return null;

    let eth = window.ethereum as any;

    // Handle Multiple Injection (Legacy way: window.ethereum.providers)
    if (eth.providers?.length) {
        // Prefer MetaMask to avoid conflicts with Core Wallet default injection
        const mm = eth.providers.find((p: any) => p.isMetaMask);
        eth = mm || eth.providers[0];
    } else if (window.avalanche && !eth.isMetaMask) {
        // If Core is injected as window.avalanche and ethereum is confused, prefer ethereum if it claims isMetaMask? 
        // No, keep simple: use eth, but polyfill carefully.
    }

    if (!eth) return null;

    // Polyfill Ethers requirements (addListener/removeListener)
    try {
        if (!eth.addListener && eth.on) eth.addListener = eth.on.bind(eth);
        if (!eth.removeListener && eth.off) eth.removeListener = eth.off.bind(eth);
    } catch (e) {
        // If unable to mutate (Read-only Proxy), create a wrapper
        console.warn("Provider is read-only, creating wrapper");
        const original = eth;
        eth = {
            request: original.request.bind(original),
            on: original.on?.bind(original),
            off: original.off?.bind(original),
            addListener: original.on?.bind(original),
            removeListener: original.off?.bind(original),
            isMetaMask: original.isMetaMask,
            isAvalanche: original.isAvalanche
        };
    }

    try {
        return new ethers.BrowserProvider(eth, "any");
    } catch (e) {
        console.error("Error creating BrowserProvider", e);
        return null;
    }
}

export function ConnectWallet({ onConnect }: ConnectWalletProps) {
    const [address, setAddress] = useState<string | null>(null);
    const [balance, setBalance] = useState<string>('0');
    const [isConnecting, setIsConnecting] = useState(false);
    // Track if user explicitly disconnected (persists to prevent auto-reconnect)
    const [isDisconnected, setIsDisconnected] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('wallet-disconnected') === 'true';
        }
        return false;
    });

    useEffect(() => {
        // Polyfill ethereum listeners immediately on mount
        if (typeof window !== 'undefined' && window.ethereum) {
            const eth = window.ethereum as any;
            if (!eth.addListener && eth.on) eth.addListener = eth.on.bind(eth);
            if (!eth.removeListener && eth.off) eth.removeListener = eth.off.bind(eth);
        }
        // Only auto-reconnect if user didn't explicitly disconnect
        if (!isDisconnected) {
            checkIfWalletIsConnected();
        }
    }, [isDisconnected]);

    // Listen for account changes
    useEffect(() => {
        if (typeof window === 'undefined' || !window.ethereum) return;

        const handleAccountsChanged = (accounts: string[]) => {
            if (accounts.length > 0) {
                // User connected an account - clear disconnect flag
                setIsDisconnected(false);
                localStorage.removeItem('wallet-disconnected');
                setAddress(accounts[0]);
                checkIfWalletIsConnected();
            } else {
                // User disconnected all accounts from this site
                setAddress(null);
            }
        };

        const handleChainChanged = () => {
            window.location.reload();
        };

        try {
            window.ethereum.on?.('accountsChanged', handleAccountsChanged);
            window.ethereum.on?.('chainChanged', handleChainChanged);
        } catch (e) {
            console.warn('Failed to add ethereum event listeners', e);
        }

        return () => {
            try {
                window.ethereum.removeListener?.('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener?.('chainChanged', handleChainChanged);
            } catch (e) {
                // Ignore cleanup errors
            }
        };
    }, []);

    async function checkIfWalletIsConnected() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const provider = getSafeProvider();
                if (!provider) return;
                const accounts = await provider.listAccounts();
                if (accounts.length > 0) {
                    const signer = await provider.getSigner();
                    const addr = accounts[0].address;
                    setAddress(addr);
                    updateBalance(provider, addr);
                    if (onConnect) onConnect(provider, signer, addr);
                }
            } catch (error) {
                console.error("Error checking wallet connection:", error);
            }
        }
    }

    async function connectWallet() {
        if (typeof window.ethereum === 'undefined') {
            alert('Vui lòng cài đặt MetaMask hoặc Core Wallet!');
            return;
        }

        setIsConnecting(true);
        // Clear disconnect flag when user explicitly tries to connect
        setIsDisconnected(false);
        localStorage.removeItem('wallet-disconnected');

        try {
            const provider = getSafeProvider();
            if (!provider) {
                alert("Không tìm thấy ví tương thích. Hãy thử refresh trang.");
                return;
            }

            // Use provider.send ensures we use the same provider instance (e.g. MetaMask specific)
            await provider.send("eth_requestAccounts", []);

            const signer = await provider.getSigner();
            const addr = await signer.getAddress();
            setAddress(addr);
            updateBalance(provider, addr);
            if (onConnect) onConnect(provider, signer, addr);
        } catch (error: any) {
            console.error("Error connecting wallet:", error);
            // Show user-friendly error
            if (error?.code === 4001) {
                alert('Bạn đã từ chối kết nối ví.');
            } else if (error?.message?.includes('addListener')) {
                alert('Có xung đột giữa các ví (Core/MetaMask). Hãy tắt một trong hai.');
            } else {
                alert(`Lỗi kết nối: ${error?.message || 'Unknown error'}`);
            }
        } finally {
            setIsConnecting(false);
        }
    }

    async function updateBalance(provider: ethers.BrowserProvider, addr: string) {
        try {
            const bal = await provider.getBalance(addr);
            setBalance(Number(ethers.formatEther(bal)).toFixed(4));
        } catch (e: any) {
            console.error("Failed to fetch balance:", e.message || e);
            // Don't block the wallet connection flow; just show unknown balance
            setBalance('?');
        }
    }

    function disconnect() {
        // Clear local state and persist disconnect preference
        setAddress(null);
        setBalance('0');
        setIsDisconnected(true);
        localStorage.setItem('wallet-disconnected', 'true');
    }

    if (address) {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-9 gap-2 px-3">
                        <Wallet className="h-4 w-4 text-primary" />
                        <span className="hidden md:inline font-mono">{address.substring(0, 6)}...{address.substring(address.length - 4)}</span>
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px] font-normal hidden sm:inline-flex">
                            {balance} AVAX
                        </Badge>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Wallet</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="font-mono text-xs">
                        {address}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => {
                        navigator.clipboard.writeText(address);
                    }}>
                        Copy Address
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={disconnect} className="text-red-500 mb-0.5">
                        <LogOut className="mr-2 h-4 w-4" /> Disconnect (Local)
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    return (
        <Button onClick={connectWallet} disabled={isConnecting} className="gap-2 h-9">
            <Wallet className="h-4 w-4" />
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </Button>
    );
}
