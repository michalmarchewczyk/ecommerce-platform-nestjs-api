import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cart } from './models/cart.entity';
import { Repository } from 'typeorm';
import { ProductsService } from '../catalog/products/products.service';

@Injectable()
export class CartsService {
  constructor(
    @InjectRepository(Cart) private cartsRepository: Repository<Cart>,
    private productsService: ProductsService,
  ) {}
}
