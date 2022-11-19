import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { AttributeType } from './entities/attribute-type.entity';
import { Attribute } from './entities/attribute.entity';
import { AttributeTypesModule } from './attribute-types/attribute-types.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductRatingsModule } from './product-ratings/product-ratings.module';
import { ProductPhotosModule } from './product-photos/product-photos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Attribute, AttributeType]),
    AttributeTypesModule,
    CategoriesModule,
    ProductRatingsModule,
    ProductPhotosModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
