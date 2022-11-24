import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './models/product.entity';
import { AttributeType } from '../attribute-types/models/attribute-type.entity';
import { Attribute } from './models/attribute.entity';
import { ProductPhotosModule } from './product-photos/product-photos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Attribute, AttributeType]),
    ProductPhotosModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
