import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../entities/category.entity';
import { Product } from '../entities/product.entity';
import { CategoryGroup } from '../entities/category-group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Product, CategoryGroup])],
  controllers: [CategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
