import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '../../users/entities/role.enum';
import { CategoryCreateDto } from '../dto/category-create.dto';
import { CategoryUpdateDto } from '../dto/category-update.dto';
import { Product } from '../entities/product.entity';
import { Category } from '../entities/category.entity';

@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  async getCategories(): Promise<Category[]> {
    return this.categoriesService.getCategories();
  }

  @Get('/:id')
  async getCategory(@Param('id', ParseIntPipe) id: number): Promise<Category> {
    return await this.categoriesService.getCategory(id);
  }

  @Post()
  @Roles(Role.Admin, Role.Manager)
  async createCategory(@Body() category: CategoryCreateDto): Promise<Category> {
    return await this.categoriesService.createCategory(category);
  }

  @Patch('/:id')
  @Roles(Role.Admin, Role.Manager)
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() category: CategoryUpdateDto,
  ): Promise<Category> {
    return await this.categoriesService.updateCategory(id, category);
  }

  @Delete('/:id')
  @Roles(Role.Admin, Role.Manager)
  async deleteCategory(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.categoriesService.deleteCategory(id);
  }

  @Get('/:id/products')
  async getCategoryProducts(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Product[]> {
    return await this.categoriesService.getCategoryProducts(id);
  }

  @Post('/:id/products')
  @Roles(Role.Admin, Role.Manager)
  async addCategoryProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body('productId') productId: number,
  ): Promise<Product> {
    return await this.categoriesService.addCategoryProduct(id, productId);
  }

  @Delete('/:id/products/:productId')
  @Roles(Role.Admin, Role.Manager)
  async deleteCategoryProduct(
    @Param('id', ParseIntPipe) id: number,
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<void> {
    await this.categoriesService.deleteCategoryProduct(id, productId);
  }
}
