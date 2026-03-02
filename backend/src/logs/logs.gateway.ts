import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: 'logs',
})
export class LogsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server;

    private readonly logger = new Logger(LogsGateway.name);

    handleConnection(client: Socket) {
        this.logger.log(`Logs Client connected: ${client.id}`);

        // Send a welcome log
        client.emit('new-log', {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            level: 'info',
            message: 'Connected to Real-Time Logs Stream',
        });
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Logs Client disconnected: ${client.id}`);
    }

    broadcastLog(log: { level: string; message: string; command?: string }) {
        this.server.emit('new-log', {
            id: Date.now().toString(), // Simple ID generation
            timestamp: new Date().toISOString(),
            ...log,
        });
    }
}
