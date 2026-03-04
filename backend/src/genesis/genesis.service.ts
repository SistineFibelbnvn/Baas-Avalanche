import { Injectable } from '@nestjs/common';

@Injectable()
export class GenesisService {
    validate(genesisData: any): { valid: boolean; message: string } {
        if (!genesisData) {
            return { valid: false, message: 'Genesis data is empty' };
        }

        // Basic structure check for Avalanche Genesis
        // This is a simplified check. Real genesis files are complex.
        const hasAlloc = 'alloc' in genesisData;
        const hasConfig = 'config' in genesisData;
        const hasNonce = 'nonce' in genesisData;
        const hasTimestamp = 'timestamp' in genesisData;
        const hasInitialStakers = 'initialStakers' in genesisData;

        // Check for C-Chain style (EVM) or Subnet style
        if (hasConfig && hasAlloc) {
            return { valid: true, message: 'Valid EVM/Subnet Genesis Configuration' };
        }

        // Check for P-Chain/X-Chain style
        if (hasInitialStakers) {
            return { valid: true, message: 'Valid Platform Chain Genesis Configuration' };
        }

        // Loose check for purely JSON validity if specific fields are missing but structure looks "ok-ish"
        // For the purpose of the demo, we want to allow valid JSON editing.
        if (Object.keys(genesisData).length > 0) {
            return { valid: true, message: 'Valid JSON format, specific chain structures unverified but strictly valid JSON.' };
        }

        return { valid: false, message: 'Missing critical genesis fields (alloc, config, or initialStakers)' };
    }
}
