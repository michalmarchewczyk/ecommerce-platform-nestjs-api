import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class ReturnCreateDto {
  @IsInt()
  @IsNotEmpty()
  orderId: number;

  @IsString()
  @IsNotEmpty()
  message: string;
}
