import { IsNumber, IsString } from 'class-validator';

export class AttributeDto {
  @IsString()
  value: string;

  @IsNumber()
  typeId: number;
}
