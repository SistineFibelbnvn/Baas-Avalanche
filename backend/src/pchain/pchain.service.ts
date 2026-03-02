import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Avalanche } from 'avalanche';
import { PlatformVMAPI } from 'avalanche/dist/apis/platformvm';

@Injectable()
export class PChainService {
  private readonly logger = new Logger(PChainService.name);
  private readonly platform: PlatformVMAPI;
  private readonly defaultSubnetId: string;

  constructor(private readonly configService: ConfigService) {
    const nodeConfig = this.configService.get('avalancheNode');
    const host = nodeConfig?.host ?? '127.0.0.1';
    const port = nodeConfig?.port ?? 9650;
    const protocol = nodeConfig?.protocol ?? 'http';

    const avalanche = new Avalanche(host, port, protocol);
    this.platform = avalanche.PChain();
    this.defaultSubnetId = nodeConfig?.defaultSubnetId ?? '11111111111111111111111111111111LpoYY';
  }

  async getValidators(subnetId?: string) {
    try {
      const targetSubnet = subnetId ?? this.defaultSubnetId;
      if (!targetSubnet) {
        return [];
      }

      // Basic validation to prevent crash on non-CB58 IDs (like UUIDs)
      if (targetSubnet.includes('-') || targetSubnet.length < 30) {
        // Silently ignore invalid IDs to prevent log noise
        return [];
      }

      // AvalancheJS might fail if subnetID is not a valid P-Chain recognized string
      const result = await this.platform.getCurrentValidators(targetSubnet);
      const res = result as any;
      return res.validators ?? res;
    } catch (error: any) {
      if (error?.isAxiosError && error.code === 'ECONNREFUSED') {
        this.logger.debug(`Could not reach P-Chain (Node offline): ${error.message}`);
      } else if (error.message && error.message.includes('not valid JSON') && error.message.includes('API call')) {
        this.logger.debug(`P-Chain API call rejected (Node is likely still booting up)`);
      } else {
        this.logger.error(`Failed to get validator list from P-Chain: ${error.message}`);
      }
      return [];
    }
  }

  async getSubnets() {
    try {
      const res = (await this.platform.getSubnets()) as any;
      return res.subnets ?? res;
    } catch (error: any) {
      if (error?.isAxiosError && error.code === 'ECONNREFUSED') {
        this.logger.debug(`Could not reach P-Chain (Node offline): ${error.message}`);
      } else {
        this.logger.error(`Failed to get subnet list from P-Chain: ${error.message}`);
      }
      return [];
    }
  }
}

