import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 20 }, // Ramp up to 20 users
        { duration: '1m', target: 20 },  // Stay at 20 users for 1 minute
        { duration: '30s', target: 0 },  // Ramp down to 0 users
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    },
};

const BASE_URL = 'http://localhost:4000';

export default function () {
    // Core
    const resSubnets = http.get(`${BASE_URL}/subnets`);
    check(resSubnets, { 'subnets status was 200': (r) => r.status === 200 });

    const resValidators = http.get(`${BASE_URL}/validators`);
    check(resValidators, { 'validators status was 200': (r) => r.status === 200 });

    // P-Chain
    const resPChainValidators = http.get(`${BASE_URL}/pchain/validators`);
    check(resPChainValidators, { 'pchain validators status was 200': (r) => r.status === 200 });

    const resPChainSubnets = http.get(`${BASE_URL}/pchain/subnets`);
    check(resPChainSubnets, { 'pchain subnets status was 200': (r) => r.status === 200 });

    // Node Status
    const resNodeStatus = http.get(`${BASE_URL}/node/status`);
    check(resNodeStatus, { 'node status status was 200': (r) => r.status === 200 });

    const resNodeDashboard = http.get(`${BASE_URL}/node/dashboard`);
    check(resNodeDashboard, { 'node dashboard status was 200': (r) => r.status === 200 });

    const resNodeBlocks = http.get(`${BASE_URL}/node/blocks`);
    check(resNodeBlocks, { 'node blocks status was 200': (r) => r.status === 200 });

    // Contracts
    const resContracts = http.get(`${BASE_URL}/contracts`);
    check(resContracts, { 'contracts status was 200': (r) => r.status === 200 });

    // Monitoring
    const resMonitoring = http.get(`${BASE_URL}/monitoring/status`);
    check(resMonitoring, { 'monitoring status was 200': (r) => r.status === 200 });

    // Metrics
    const resMetrics = http.get(`${BASE_URL}/metrics`);
    check(resMetrics, { 'metrics status was 200': (r) => r.status === 200 });

    const resMetricsLive = http.get(`${BASE_URL}/metrics/live`);
    check(resMetricsLive, { 'metrics live status was 200': (r) => r.status === 200 });

    // Health & Alerts
    const resHealth = http.get(`${BASE_URL}/health`);
    check(resHealth, { 'health status was 200': (r) => r.status === 200 });

    const resAlerts = http.get(`${BASE_URL}/alerts`);
    check(resAlerts, { 'alerts status was 200': (r) => r.status === 200 });

    sleep(1);
}
