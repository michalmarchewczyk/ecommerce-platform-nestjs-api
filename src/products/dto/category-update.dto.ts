import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CategoryUpdateDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsOptional()
  parentCategoryId?: number;
}
