import { Module } from '@nestjs/common';
import { CartsService } from './carts.service';
import { CartsController } from './carts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from './models/cart.entity';
import { CatalogModule } from '../catalog/catalog.module';

@Module({
  imports: [CatalogModule, TypeOrmModule.forFeature([Cart])],
  providers: [CartsService],
  controllers: [CartsController],
})
export class CartsModule {}
