import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';

export class OrderCreateDto {
  @IsInt({ each: true })
  @IsNotEmpty({ each: true })
  productIds: number[];

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  contactEmail: string;

  @IsPhoneNumber()
  @IsNotEmpty()
  contactPhone: string;

  @IsString()
  @IsOptional()
  message?: string;
}
