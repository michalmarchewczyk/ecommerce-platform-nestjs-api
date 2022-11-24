import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './models/category.entity';
import { Product } from '../products/models/product.entity';
import { CategoryGroup } from './models/category-group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Product, CategoryGroup])],
  controllers: [CategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
