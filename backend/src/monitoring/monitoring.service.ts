import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class MonitoringService {
    private readonly logger = new Logger(MonitoringService.name);
    private readonly composeFilePath: string;

    constructor() {
        // Assuming backend is at Layer1/backend and monitoring is at Layer1/monitoring
        // process.cwd() should be Layer1/backend when running npm start
        this.composeFilePath = path.resolve(process.cwd(), '../monitoring/docker-compose.yml');
        this.logger.log(`Monitoring Stack Config Path: ${this.composeFilePath}`);
    }

    async getStatus() {
        try {
            if (!fs.existsSync(this.composeFilePath)) {
                return {
                    prometheusRunning: false,
                    grafanaRunning: false,
                    status: 'NOT_CONFIGURED',
                    grafanaUrl: null,
                    prometheusUrl: null,
                };
            }

            // Check running containers for this project
            const { stdout } = await execAsync(`docker compose -f "${this.composeFilePath}" ps --format json`);

            // Fallback check if JSON parsing fails or older version
            if (!stdout || stdout.trim() === '[]') {
                return {
                    prometheusRunning: false,
                    grafanaRunning: false,
                    status: 'STOPPED',
                    grafanaUrl: null,
                    prometheusUrl: null,
                };
            }

            let services = [];
            try {
                // Some docker versions output separate JSON objects per line instead of an array
                const lines = stdout.trim().split('\n');
                services = lines.map(line => JSON.parse(line));
            } catch (e) {
                try {
                    services = JSON.parse(stdout);
                } catch (ex) {
                    this.logger.warn('Failed to parse Docker PS output');
                    return {
                        prometheusRunning: false,
                        grafanaRunning: false,
                        status: 'UNKNOWN',
                        grafanaUrl: null,
                        prometheusUrl: null,
                    };
                }
            }

            // Check individual service status
            const prometheusService = services.find((s: any) =>
                (s.Name || s.Service || '').toLowerCase().includes('prometheus') &&
                !(s.Name || s.Service || '').toLowerCase().includes('alertmanager')
            );
            const grafanaService = services.find((s: any) =>
                (s.Name || s.Service || '').toLowerCase().includes('grafana')
            );
            const lokiService = services.find((s: any) =>
                (s.Name || s.Service || '').toLowerCase().includes('loki')
            );
            const alertmanagerService = services.find((s: any) =>
                (s.Name || s.Service || '').toLowerCase().includes('alertmanager')
            );

            const isServiceRunning = (service: any) => service &&
                (service.State === 'running' || service.State?.includes('Up'));

            const prometheusRunning = isServiceRunning(prometheusService);
            const grafanaRunning = isServiceRunning(grafanaService);
            const lokiRunning = isServiceRunning(lokiService);
            const alertmanagerRunning = isServiceRunning(alertmanagerService);

            const isRunning = prometheusRunning || grafanaRunning;

            return {
                prometheusRunning: !!prometheusRunning,
                grafanaRunning: !!grafanaRunning,
                lokiRunning: !!lokiRunning,
                alertmanagerRunning: !!alertmanagerRunning,
                status: isRunning ? 'RUNNING' : 'STOPPED',
                grafanaUrl: grafanaRunning ? 'http://localhost:3010' : null,
                prometheusUrl: prometheusRunning ? 'http://localhost:9090' : null,
                lokiUrl: lokiRunning ? 'http://localhost:3100' : null,
                alertmanagerUrl: alertmanagerRunning ? 'http://localhost:9093' : null,
                services: services.map((s: any) => ({
                    name: s.Name || s.Service,
                    state: s.State,
                    status: s.Status
                }))
            };

        } catch (error) {
            this.logger.error('Failed to get monitoring status', error);
            return {
                prometheusRunning: false,
                grafanaRunning: false,
                status: 'ERROR',
                error: String(error),
                grafanaUrl: null,
                prometheusUrl: null,
            };
        }
    }

    async startStack() {
        try {
            this.logger.log('Starting monitoring stack...');
            if (!fs.existsSync(this.composeFilePath)) {
                throw new Error(`Config file not found at ${this.composeFilePath}`);
            }

            await execAsync(`docker compose -f "${this.composeFilePath}" up -d`);
            this.logger.log('Monitoring stack started successfully');
            return { success: true, status: 'RUNNING' };
        } catch (error) {
            this.logger.error('Failed to start monitoring stack', error);
            throw new Error(`Failed to start monitoring: ${String(error)}`);
        }
    }

    async stopStack() {
        try {
            this.logger.log('Stopping monitoring stack...');
            if (!fs.existsSync(this.composeFilePath)) {
                throw new Error(`Config file not found at ${this.composeFilePath}`);
            }

            await execAsync(`docker compose -f "${this.composeFilePath}" down`);
            this.logger.log('Monitoring stack stopped successfully');
            return { success: true, status: 'STOPPED' };
        } catch (error) {
            this.logger.error('Failed to stop monitoring stack', error);
            throw new Error(`Failed to stop monitoring: ${String(error)}`);
        }
    }
}
