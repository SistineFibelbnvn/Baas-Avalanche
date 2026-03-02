export interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  host: string;
  services: Record<string, string>;
}

