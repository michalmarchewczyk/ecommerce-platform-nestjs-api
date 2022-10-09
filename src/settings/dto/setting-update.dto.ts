import { IsString } from 'class-validator';

export class SettingUpdateDto {
  @IsString()
  value: string;
}
