import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PageCreateDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}
