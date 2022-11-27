import { DataType } from '../models/data-type.enum';
import { ArrayNotEmpty, IsArray, IsEnum, IsIn } from 'class-validator';

export class ExportDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(DataType, { each: true })
  data: DataType[];

  @IsIn(['json', 'csv'])
  format: 'json' | 'csv';
}
