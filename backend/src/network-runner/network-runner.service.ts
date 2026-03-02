import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class NetworkRunnerService implements OnModuleInit {
    private readonly logger = new Logger(NetworkRunnerService.name);
    private readonly baseUrl = 'http://127.0.0.1:8081';

    async onModuleInit() {
        // Attempt to auto-start the cluster after a short delay to allow Docker to come up
        setTimeout(() => this.ensureClusterRunning(), 5000);
    }

    async ensureClusterRunning() {
        try {
            // Ping
            await axios.get(`${this.baseUrl}/v1/ping`);

            const info = await this.getClusterInfo();
            if (info && info.nodeNames && info.nodeNames.length > 0) {
                this.logger.log(`Cluster already running with ${info.nodeNames.length} nodes.`);
                return;
            }

            this.logger.log('Cluster is empty. Starting default 5-node cluster...');
            await this.startCluster();

        } catch (error: any) {
            // Silently ignore - node/docker is just not running
        }
    }

    async getClusterInfo() {
        try {
            const res = await axios.post(`${this.baseUrl}/v1/control/status`);
            return res.data?.clusterInfo;
        } catch (e) {
            return null;
        }
    }

    async startCluster() {
        // Start a default 5 node cluster
        const payload = {
            "numNodes": 5,
            // If we don't specify execPath, the runner container usually defaults to its internal binary
            "logLevel": "INFO"
        };

        try {
            const res = await axios.post(`${this.baseUrl}/v1/control/start`, payload);
            this.logger.log('Cluster started successfully!');
            return res.data;
        } catch (e: any) {
            this.logger.error(`Failed to start cluster: ${e.response?.data?.message || e.message}`);
            throw e;
        }
    }

    async addNode(name: string) {
        this.logger.log(`Adding node ${name}...`);
        const payload = {
            "name": name
        };
        const res = await axios.post(`${this.baseUrl}/v1/control/addnode`, payload);
        return res.data;
    }

    async removeNode(name: string) {
        this.logger.log(`Removing node ${name}...`);
        const payload = {
            "name": name
        };
        const res = await axios.post(`${this.baseUrl}/v1/control/removenode`, payload);
        return res.data;
    }
}
