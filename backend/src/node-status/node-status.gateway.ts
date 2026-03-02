import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NodeStatusService } from './node-status.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: 'node-status',
})
export class NodeStatusGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server;

    private readonly logger = new Logger(NodeStatusGateway.name);
    private globalInterval: NodeJS.Timeout | null = null;

    // Map to store per-client chain polling intervals
    private clientChainIntervals: Map<string, NodeJS.Timeout> = new Map();

    constructor(private readonly nodeStatusService: NodeStatusService) { }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
        if (!this.globalInterval) {
            this.startBroadcasting();
        }
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
        // Clean up any client-specific intervals
        if (this.clientChainIntervals.has(client.id)) {
            clearInterval(this.clientChainIntervals.get(client.id));
            this.clientChainIntervals.delete(client.id);
        }
    }

    @SubscribeMessage('subscribe_chain')
    async handleChainSubscription(
        @MessageBody() data: { rpcUrl: string, subnetName?: string },
        @ConnectedSocket() client: Socket,
    ) {
        this.logger.log(`Client ${client.id} subscribed to chain: ${data.rpcUrl} (${data.subnetName || 'Unknown'})`);

        // Clear existing interval for this client if any
        if (this.clientChainIntervals.has(client.id)) {
            clearInterval(this.clientChainIntervals.get(client.id));
        }

        if (!data.rpcUrl) return;

        // Maintain state for this subscription
        let currentRpcUrl = data.rpcUrl;
        const targetSubnetName = data.subnetName;

        // Immediate fetch
        const initialStats = await this.nodeStatusService.fetchChainStats(currentRpcUrl, targetSubnetName);
        if (initialStats.rpcUrl && initialStats.rpcUrl !== currentRpcUrl) {
            currentRpcUrl = initialStats.rpcUrl;
            this.logger.log(`Updated RPC URL for client ${client.id} to ${currentRpcUrl}`);
        }
        client.emit('chain-stats', initialStats);

        // Poll every 3 seconds for chain specific stats
        const interval = setInterval(async () => {
            const stats = await this.nodeStatusService.fetchChainStats(currentRpcUrl, targetSubnetName);

            // If we resolved a new URL, update our local state so next poll uses it
            if (stats.rpcUrl && stats.rpcUrl !== currentRpcUrl) {
                currentRpcUrl = stats.rpcUrl;
                this.logger.log(`Updated RPC URL for client ${client.id} to ${currentRpcUrl}`);
            }

            client.emit('chain-stats', stats);
        }, 3000);

        this.clientChainIntervals.set(client.id, interval);
    }

    private startBroadcasting() {
        this.logger.log('Starting node status broadcast...');
        this.globalInterval = setInterval(async () => {
            try {
                const status = await this.nodeStatusService.fetchStatus();
                this.server.emit('status', status);
            } catch (error) {
                this.logger.error('Error broadcasting node status', error);
            }
        }, 5000); // Broadcast every 5 seconds
    }
}
