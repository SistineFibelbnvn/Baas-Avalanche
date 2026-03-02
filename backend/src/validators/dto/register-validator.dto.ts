import { IsEnum, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class RegisterValidatorDto {
  @IsString()
  name!: string;

  @IsString()
  nodeId!: string;

  @IsString()
  rewardAddress!: string;

  @IsNumber()
  stakeAmount!: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  stakeStatus?: string; // StakeStatus enum temporarily removed to prevent crash
}

