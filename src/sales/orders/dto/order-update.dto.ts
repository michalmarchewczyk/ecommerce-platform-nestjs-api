import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { OrderStatus } from '../models/order-status.enum';
import { OrderItemDto } from './order-item.dto';
import { Type } from 'class-transformer';
import { OrderDeliveryDto } from './order-delivery.dto';
import { OrderPaymentDto } from './order-payment.dto';

export class OrderUpdateDto {
  @IsNotEmpty({ each: true })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @IsOptional()
  items?: OrderItemDto[];

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

  @IsOptional()
  @ValidateNested()
  @Type(() => OrderDeliveryDto)
  delivery?: OrderDeliveryDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => OrderPaymentDto)
  payment?: OrderPaymentDto;
}
