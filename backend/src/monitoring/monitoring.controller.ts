import { Controller, Get, Post, Param, Res, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { MonitoringService } from './monitoring.service';

import { ValidatorsService } from '../validators/validators.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('monitoring')
export class MonitoringController {
    constructor(
        private readonly monitoringService: MonitoringService,
        private readonly validatorsService: ValidatorsService,
        private readonly prisma: PrismaService,
    ) { }

    @Get('targets')
    async getTargets() {
        const dynamicTargets = this.validatorsService.getPrometheusTargets();

        // Always include the primary C-Chain node
        const staticTargets: any[] = [
            {
                targets: ['host.docker.internal:4000'],
                labels: { __metrics_path__: '/monitoring/metrics/9650', job: 'avalanche_node', instance: 'primary-node' }
            }
        ];

        // Dynamically add subnet node targets from DB (only RUNNING networks with known RPC)
        try {
            const networks = await this.prisma.network.findMany({
                where: { status: 'RUNNING', rpcUrl: { not: null } }
            });
            networks.forEach(n => {
                // Extract port from rpcUrl e.g. http://127.0.0.1:9654/ext/bc/.../rpc
                const match = n.rpcUrl?.match(/:(\d+)\//);
                if (match) {
                    const port = parseInt(match[1]);
                    if (port !== 9650) { // Already have primary
                        staticTargets.push({
                            targets: ['host.docker.internal:4000'],
                            labels: {
                                __metrics_path__: `/monitoring/metrics/${port}`,
                                job: 'avalanche_node',
                                instance: `subnet-${n.name}`
                            }
                        });
                    }
                }
            });
        } catch (e) {
            // DB not ready yet, skip dynamic targets
        }

        return [...staticTargets, ...dynamicTargets];
    }

    // Metrics proxy: forwards /ext/metrics from local Avalanche node
    @Get('metrics/:port')
    async getMetricsProxy(@Param('port') port: string, @Res() res: Response) {
        const http = require('http');
        const targetPort = parseInt(port) || 9650;
        // Avalanche CLI uses ports 9650-9699 for nodes (primary + subnets)
        const isStaticPort = targetPort >= 9650 && targetPort <= 9699;
        const isDynamicPort = targetPort >= 10000 && targetPort <= 30000;
        if (!isStaticPort && !isDynamicPort) {
            res.status(400).send('Invalid port');
            return;
        }
        try {
            const data = await new Promise<string>((resolve, reject) => {
                const req = http.get(`http://127.0.0.1:${targetPort}/ext/metrics`, (resp: any) => {
                    let body = '';
                    resp.on('data', (chunk: string) => body += chunk);
                    resp.on('end', () => resolve(body));
                });
                req.on('error', reject);
                req.setTimeout(5000, () => { req.destroy(); reject(new Error('timeout')); });
            });

            // Validate: Prometheus text format starts with '#' or metric lines
            // If response is not valid Prometheus format (e.g. JSON error), return HTTP 200
            // with a comment so Prometheus marks target as UP but shows no data (not DOWN with parse error)
            const trimmed = data.trim();
            const isValidPrometheus = trimmed.startsWith('#') || /^[a-zA-Z_]/.test(trimmed);
            if (!isValidPrometheus) {
                // Return 200 with comment — Prometheus keeps target UP, just no metrics scraped
                res.status(200).set('Content-Type', 'text/plain; charset=utf-8')
                    .send(`# Node at port ${targetPort} returned non-Prometheus response (node may be bootstrapping)\n`);
                return;
            }

            res.set('Content-Type', 'text/plain; charset=utf-8');
            res.send(data);
        } catch {
            // Return 200 with comment instead of 503 to avoid Prometheus parse errors
            res.status(200).set('Content-Type', 'text/plain; charset=utf-8')
                .send(`# Node at port ${targetPort} not reachable\n`);
        }
    }

    @Get('status')
    async getStatus() {
        return this.monitoringService.getStatus();
    }

    @Post('start')
    async startStack() {
        try {
            return await this.monitoringService.startStack();
        } catch (error) {
            throw new HttpException(
                (error as Error).message || 'Failed to start monitoring',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Post('stop')
    async stopStack() {
        try {
            return await this.monitoringService.stopStack();
        } catch (error) {
            throw new HttpException(
                (error as Error).message || 'Failed to stop monitoring',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
