import { DataType } from '../models/data-type.enum';
import { ArrayNotEmpty, IsArray, IsEnum } from 'class-validator';

export class ExportDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(DataType, { each: true })
  data: DataType[];
}
