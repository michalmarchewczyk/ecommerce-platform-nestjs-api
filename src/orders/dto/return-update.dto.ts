import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ReturnStatus } from '../entities/return-status.enum';

export class ReturnUpdateDto {
  @IsString()
  @IsOptional()
  message?: string;

  @IsString()
  @IsOptional()
  @IsEnum(ReturnStatus)
  status?: ReturnStatus;
}
