import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../entities/product.entity';
import { AttributeType } from '../entities/attribute-type.entity';
import { Attribute } from '../entities/attribute.entity';
import { ProductPhotosModule } from './product-photos/product-photos.module';
import { ProductRating } from '../entities/product-rating.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Attribute,
      AttributeType,
      ProductRating,
    ]),
    ProductPhotosModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
