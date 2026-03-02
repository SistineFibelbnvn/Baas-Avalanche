import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateValidatorDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  rewardAddress?: string;

  @IsOptional()
  @IsNumber()
  stakeAmount?: number;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

