import { IsBooleanString, IsOptional } from 'class-validator';

export class ImportDto {
  @IsBooleanString()
  @IsOptional()
  clear?: string;

  @IsBooleanString()
  @IsOptional()
  noImport?: string;
}
