import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RpcProxyService {
    private readonly logger = new Logger(RpcProxyService.name);

    constructor(
        private readonly httpService: HttpService,
        private readonly prisma: PrismaService
    ) { }

    async forwardRequest(subnetId: string, body: any) {
        // 1. Resolve Target URL
        let targetUrl = 'http://127.0.0.1:9650/ext/bc/C/rpc'; // Default to C-Chain

        if (subnetId !== 'primary' && subnetId !== 'c-chain' && subnetId !== 'primary-c-chain') {
            try {
                // Find subnet config
                // Try finding by ID first (DB or Avalanche ID)
                const subnet = await this.prisma.network.findFirst({
                    where: {
                        OR: [
                            { id: subnetId },
                            { subnetId: subnetId },
                            { name: subnetId }
                        ]
                    }
                });

                if (subnet && subnet.rpcUrl) {
                    targetUrl = subnet.rpcUrl;
                    // Ensure localhost usage if running in same environment
                    targetUrl = targetUrl.replace('localhost', '127.0.0.1');
                } else {
                    this.logger.warn(`Subnet ${subnetId} not found in DB, trying direct fallback if it looks like an ID`);
                    // Fallback: If it looks like a blockchain ID
                    if (subnetId.length > 30) {
                        targetUrl = `http://127.0.0.1:9650/ext/bc/${subnetId}/rpc`;
                    }
                }
            } catch (e) {
                this.logger.error(`Error resolving proxy target: ${e}`);
            }
        }

        // 2. Forward Request
        try {
            const response = await firstValueFrom(
                this.httpService.post(targetUrl, body, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 10000 // 10s timeout
                })
            );
            return response.data;
        } catch (error: any) {
            const isBatch = Array.isArray(body);
            if (error.code === 'ECONNREFUSED' || error.response?.status === 503) {
                // To avoid spam, just debug or warn conditionally, or omit
                this.logger.debug(`Proxy Request connection refused/503 to ${targetUrl} (Node likely offline)`);
            } else {
                this.logger.error(`Proxy Request Failed to ${targetUrl}: ${error.message}`);
            }

            // Return JSON-RPC error format
            if (isBatch) {
                return body.map((req: any) => ({
                    jsonrpc: '2.0',
                    id: req.id,
                    error: {
                        code: -32603,
                        message: `Proxy Error: ${error.message}`
                    }
                }));
            }

            return {
                jsonrpc: '2.0',
                id: body.id,
                error: {
                    code: -32603,
                    message: `Proxy Error: ${error.message}`
                }
            };
        }
    }
}
