import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateAlertDto {
  @IsString()
  rule!: string;

  @IsString()
  severity!: string;

  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

