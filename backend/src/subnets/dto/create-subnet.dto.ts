import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export enum TargetNetwork {
  LOCAL = 'LOCAL',
  TESTNET = 'TESTNET',
  MAINNET = 'MAINNET'
}

export class CreateSubnetDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  vmType!: string; // 'subnet-evm' | 'custom'

  @IsOptional()
  @IsString()
  configMode?: string; // 'test' | 'production' | 'custom'

  @IsOptional()
  @IsString()
  validatorType?: string; // 'poa' | 'pos'

  @IsOptional()
  @IsEnum(TargetNetwork)
  network?: TargetNetwork;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @IsOptional()
  chainId?: number;

  @IsOptional()
  tokenSymbol?: string;

  @IsOptional()
  tokenSupply?: string;

  @IsOptional()
  gasLimit?: number;

  @IsOptional()
  minBaseFee?: string;

  @IsOptional()
  targetBlockRate?: number;

  @IsOptional()
  validatorManagerOwner?: string;

  @IsOptional()
  vmVersion?: string;

  @IsOptional()
  enableICM?: boolean;

  @IsOptional()
  vmBinaryPath?: string;

  @IsOptional()
  genesisPath?: string;

  @IsOptional()
  @IsString()
  ownerAddress?: string; // Wallet address of the owner
}

