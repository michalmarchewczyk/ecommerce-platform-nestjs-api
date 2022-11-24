import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { SettingType } from '../models/setting-type.enum';
import { ApiProperty } from '@nestjs/swagger';

export class SettingCreateDto {
  @ApiProperty({ type: 'boolean', required: false })
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
