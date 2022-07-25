import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
} from 'class-validator';

export class ProductRatingDto {
  @IsNumber()
  @IsPositive()
  productId: number;

  @IsNumber()
  @IsPositive()
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;
}
