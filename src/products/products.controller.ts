import { Controller, Get } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { Role } from '../users/entities/role.enum';
import { Roles } from '../auth/roles.decorator';

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  @Roles(Role.Admin, Role.Manager)
  getProducts(): Promise<Product[]> {
    return this.productsService.getProducts();
  }
}
