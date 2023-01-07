import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class CartItemDto {
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  quantity: number;
}
