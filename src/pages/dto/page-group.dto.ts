import { IsNotEmpty, IsString } from 'class-validator';

export class PageGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
