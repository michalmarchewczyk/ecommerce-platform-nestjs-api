import { IsNotEmpty, IsNotEmptyObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CartItemDto } from './cart-item.dto';

export class CartDto {
  @IsNotEmpty({ each: true })
  @ValidateNested({ each: true })
  @IsNotEmptyObject({ nullable: false }, { each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];
}
