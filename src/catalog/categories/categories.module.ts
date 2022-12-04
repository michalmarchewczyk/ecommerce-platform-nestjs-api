import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './models/category.entity';
import { CategoryGroup } from './models/category-group.entity';
import { ProductsModule } from '../products/products.module';
import { CategoriesExporter } from './categories.exporter';
import { CategoriesImporter } from './categories.importer';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category, CategoryGroup]),
    ProductsModule,
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService, CategoriesExporter, CategoriesImporter],
  exports: [CategoriesExporter, CategoriesImporter],
})
export class CategoriesModule {}
