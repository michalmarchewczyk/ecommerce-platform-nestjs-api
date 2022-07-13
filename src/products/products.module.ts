import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { AttributeType } from './entities/attribute-type.entity';
import { Attribute } from './entities/attribute.entity';
import { ProductPhoto } from './entities/product-photo.entity';
import { AttributesModule } from './attributes/attributes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Attribute, AttributeType, ProductPhoto]),
    AttributesModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
