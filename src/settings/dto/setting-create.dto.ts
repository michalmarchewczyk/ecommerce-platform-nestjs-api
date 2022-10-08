import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { SettingType } from '../entities/setting-type.enum';

export class SettingCreateDto {
  @IsBoolean()
  builtin = false;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsEnum(SettingType)
  type: SettingType;

  @IsString()
  defaultValue: string;

  @IsString()
  @IsOptional()
  value?: string;
}
