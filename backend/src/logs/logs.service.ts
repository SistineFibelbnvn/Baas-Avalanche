import { Injectable } from '@nestjs/common';
import { LogsGateway } from './logs.gateway';

@Injectable()
export class LogsService {
    constructor(private readonly logsGateway: LogsGateway) { }

    log(message: string) {
        this.logsGateway.broadcastLog({ level: 'info', message });
    }

    success(message: string) {
        this.logsGateway.broadcastLog({ level: 'success', message });
    }

    warn(message: string) {
        this.logsGateway.broadcastLog({ level: 'warning', message });
    }

    error(message: string) {
        this.logsGateway.broadcastLog({ level: 'error', message });
    }

    command(command: string, message: string = 'Executing command...') {
        this.logsGateway.broadcastLog({ level: 'command', message, command });
    }
}
