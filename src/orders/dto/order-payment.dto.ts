import { IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class OrderPaymentDto {
  @IsInt()
  @IsNotEmpty()
  methodId: number;

  @IsOptional()
  paymentStatus?: string;
}
