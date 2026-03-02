import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

export enum BenchmarkStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export class CreateBenchmarkDto {
  @IsString()
  scenario!: string;

  @IsObject()
  parameters!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  validatorId?: string;

  @IsOptional()
  @IsEnum(BenchmarkStatus)
  status?: BenchmarkStatus;
}

