import {
  IsEmail,
  IsNotEmpty,
  IsNotEmptyObject,
  IsOptional,
  IsPhoneNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { OrderItemDto } from './order-item.dto';
import { Type } from 'class-transformer';
import { OrderDeliveryDto } from './order-delivery.dto';
import { OrderPaymentDto } from './order-payment.dto';

export class OrderCreateDto {
  @IsNotEmpty({ each: true })
  @ValidateNested({ each: true })
  @IsNotEmptyObject({ nullable: false }, { each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  contactEmail: string;

  @IsPhoneNumber()
  @IsNotEmpty()
  contactPhone: string;

  @IsString()
  @IsOptional()
  message?: string;

  @IsNotEmpty()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => OrderDeliveryDto)
  delivery: OrderDeliveryDto;

  @IsNotEmpty()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => OrderPaymentDto)
  payment: OrderPaymentDto;
}
