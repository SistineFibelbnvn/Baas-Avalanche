import { AvalancheService } from '../avalanche/avalanche.service';

import { HealthService } from './health.service';

describe('HealthService', () => {
  it('should return ok status when rpc healthy', async () => {
    const avalancheService = {
      ping: jest.fn().mockResolvedValue(true),
    } as unknown as AvalancheService;

    const service = new HealthService(avalancheService);
    const result = await service.getStatus();

    expect(result.status).toBe('ok');
    expect(result.services.api).toBe('running');
    expect(result.services.avalancheRpc).toBe('running');
  });
});

