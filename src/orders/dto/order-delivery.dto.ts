import {
  IsInt,
  IsISO31661Alpha2,
  IsNotEmpty,
  IsOptional,
  IsPostalCode,
  IsString,
} from 'class-validator';

export class OrderDeliveryDto {
  @IsInt()
  @IsNotEmpty()
  methodId: number;

  @IsOptional()
  deliveryStatus?: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsOptional()
  @IsPostalCode('any')
  postalCode: string;

  @IsString()
  @IsNotEmpty()
  @IsISO31661Alpha2()
  country: string;
}
