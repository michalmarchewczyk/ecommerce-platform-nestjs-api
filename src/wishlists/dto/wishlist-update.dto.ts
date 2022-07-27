import { IsInt, IsOptional, IsString } from 'class-validator';

export class WishlistUpdateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsInt({ each: true })
  @IsOptional()
  productIds?: number[];
}
