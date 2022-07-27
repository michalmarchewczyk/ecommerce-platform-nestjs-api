import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class WishlistCreateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt({ each: true })
  productIds: number[];
}
