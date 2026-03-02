import { IsString } from 'class-validator';

export class UpdateValidatorStatusDto {
  @IsString()
  stakeStatus!: string;
}

