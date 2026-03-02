import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateMetricDto {
  @IsOptional()
  @IsString()
  validatorId?: string;

  @IsOptional()
  @IsString()
  runId?: string;

  @IsNumber()
  tps!: number;

  @IsNumber()
  finalityMs!: number;

  @IsNumber()
  cpuPercent!: number;

  @IsNumber()
  memoryMb!: number;
}

