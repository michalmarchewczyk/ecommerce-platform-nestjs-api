import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { Role } from '../models/role.enum';

export class UserUpdateDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
