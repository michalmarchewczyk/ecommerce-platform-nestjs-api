import { Module } from '@nestjs/common';
import { CartsService } from './carts.service';
import { CartsController } from './carts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from './models/cart.entity';
import { CatalogModule } from '../catalog/catalog.module';
import { CartItem } from './models/cart-item.entity';

@Module({
  imports: [CatalogModule, TypeOrmModule.forFeature([Cart, CartItem])],
  providers: [CartsService],
  controllers: [CartsController],
})
export class CartsModule {}
