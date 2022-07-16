import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CategoryCreateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsNumber()
  @IsOptional()
  parentCategoryId?: number;
}
