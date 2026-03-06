import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class FaucetService {
    private readonly logger = new Logger(FaucetService.name);

    // Default EWOQ Key for local Avalanche network
    private readonly EWOQ_PRIVATE_KEY = process.env.PRIVATE_KEY || '56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027';
    private readonly EWOQ_ADDRESS = '0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC';

    // Rate limiting: track last fund time per address
    private fundHistory = new Map<string, number>();
    private readonly COOLDOWN_MS = 10_000; // 10 seconds cooldown

    async fundAddress(params: {
        address: string;
        amount?: string; // in ether units, default "10"
        rpcUrl?: string;
        networkName?: string;
    }) {
        const { ethers } = await import('ethers');

        const address = params.address;
        const amount = params.amount || '10';
        const rpcUrl = params.rpcUrl || 'http://127.0.0.1:9650/ext/bc/C/rpc';
        const networkName = params.networkName || 'C-Chain';

        // Validate address
        if (!ethers.isAddress(address)) {
            return { success: false, error: 'Invalid Ethereum address' };
        }

        // Rate limit check
        const key = `${address.toLowerCase()}_${rpcUrl}`;
        const lastFund = this.fundHistory.get(key);
        if (lastFund && Date.now() - lastFund < this.COOLDOWN_MS) {
            const waitSec = Math.ceil((this.COOLDOWN_MS - (Date.now() - lastFund)) / 1000);
            return { success: false, error: `Please wait ${waitSec}s before requesting again` };
        }

        try {
            // Connect to network
            const provider = new ethers.JsonRpcProvider(rpcUrl);

            // Check provider connectivity
            try {
                await provider.getBlockNumber();
            } catch {
                return { success: false, error: `Cannot connect to ${networkName} (${rpcUrl}). Is the node running?` };
            }

            const wallet = new ethers.Wallet(this.EWOQ_PRIVATE_KEY, provider);

            // Check faucet balance
            const faucetBalance = await provider.getBalance(wallet.address);
            const amountWei = ethers.parseEther(amount);

            if (faucetBalance < amountWei) {
                return {
                    success: false,
                    error: `Faucet has insufficient balance on ${networkName}. Balance: ${ethers.formatEther(faucetBalance)} tokens`
                };
            }

            // Check recipient current balance
            const recipientBalance = await provider.getBalance(address);

            // Send tokens
            this.logger.log(`Funding ${address} with ${amount} tokens on ${networkName} (${rpcUrl})`);

            let tx;
            try {
                tx = await wallet.sendTransaction({
                    to: address,
                    value: amountWei,
                });
            } catch (e: any) {
                // If estimateGas fails, try with manual gas limit
                if (e.code === 'CALL_EXCEPTION') {
                    tx = await wallet.sendTransaction({
                        to: address,
                        value: amountWei,
                        gasLimit: 21000n,
                    });
                } else {
                    throw e;
                }
            }

            const receipt = await tx.wait();

            // Update rate limit
            this.fundHistory.set(key, Date.now());

            // Calculate new balance (don't re-query — provider may return stale cache)
            const newBalance = recipientBalance + amountWei;

            this.logger.log(`✅ Funded ${address}: ${amount} tokens, tx: ${receipt?.hash}`);

            return {
                success: true,
                txHash: receipt?.hash,
                amount,
                address,
                network: networkName,
                previousBalance: ethers.formatEther(recipientBalance),
                newBalance: ethers.formatEther(newBalance),
                faucetAddress: this.EWOQ_ADDRESS,
            };
        } catch (e: any) {
            this.logger.error(`Faucet failed: ${e.message}`);
            return { success: false, error: `Transaction failed: ${e.message}` };
        }
    }

    async getBalance(address: string, rpcUrl: string) {
        const { ethers } = await import('ethers');

        if (!ethers.isAddress(address)) {
            return { success: false, error: 'Invalid address' };
        }

        try {
            const provider = new ethers.JsonRpcProvider(rpcUrl);
            const balance = await provider.getBalance(address);
            return {
                success: true,
                address,
                balance: ethers.formatEther(balance),
                balanceWei: balance.toString(),
            };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }

    getFaucetInfo() {
        return {
            faucetAddress: this.EWOQ_ADDRESS,
            defaultAmount: '10',
            cooldownSeconds: this.COOLDOWN_MS / 1000,
        };
    }
}
