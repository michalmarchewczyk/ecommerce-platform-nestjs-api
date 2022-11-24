import { IsNotEmpty, IsString } from 'class-validator';

export class CategoryGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
