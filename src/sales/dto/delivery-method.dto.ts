import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class DeliveryMethodDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;
}
