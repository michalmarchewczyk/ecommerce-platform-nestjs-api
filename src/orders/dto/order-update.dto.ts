import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';
import { OrderStatus } from '../entities/order-status.enum';

export class OrderUpdateDto {
  @IsInt({ each: true })
  @IsOptional()
  productIds?: number[];

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @IsPhoneNumber()
  @IsOptional()
  contactPhone?: string;

  @IsString()
  @IsOptional()
  message?: string;

  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;
}
