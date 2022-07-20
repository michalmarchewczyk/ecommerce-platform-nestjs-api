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
}
