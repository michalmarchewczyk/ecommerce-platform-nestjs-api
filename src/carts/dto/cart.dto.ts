import { IsInt } from 'class-validator';

export class CartDto {
  @IsInt({ each: true })
  productIds: number[];
}
