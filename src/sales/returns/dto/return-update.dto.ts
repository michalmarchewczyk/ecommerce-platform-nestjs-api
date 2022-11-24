import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ReturnStatus } from '../models/return-status.enum';

export class ReturnUpdateDto {
  @IsString()
  @IsOptional()
  message?: string;

  @IsString()
  @IsOptional()
  @IsEnum(ReturnStatus)
  status?: ReturnStatus;
}
