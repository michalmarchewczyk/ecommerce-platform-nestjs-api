import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
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
  @Roles(Role.Admin, Role.Manager, Role.Sales, Role.Customer, Role.Disabled)
  async getCategories(): Promise<Category[]> {
    return this.categoriesService.getCategories();
  }

  @Get('/:id')
  @Roles(Role.Admin, Role.Manager, Role.Sales, Role.Customer, Role.Disabled)
  async getCategory(@Param('id', ParseIntPipe) id: number): Promise<Category> {
    const category = await this.categoriesService.getCategory(id);
    if (!category) {
      throw new NotFoundException(['category not found']);
    }
    return category;
  }

  @Post()
  @Roles(Role.Admin, Role.Manager)
  async createCategory(@Body() category: CategoryCreateDto): Promise<Category> {
    const createdCategory = await this.categoriesService.createCategory(
      category,
    );
    if (!createdCategory) {
      throw new NotFoundException(['category not found']);
    }
    return createdCategory;
  }

  @Patch('/:id')
  @Roles(Role.Admin, Role.Manager)
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() category: CategoryUpdateDto,
  ): Promise<Category> {
    const updatedCategory = await this.categoriesService.updateCategory(
      id,
      category,
    );
    if (!updatedCategory) {
      throw new NotFoundException(['category not found']);
    }
    return updatedCategory;
  }

  @Delete('/:id')
  @Roles(Role.Admin, Role.Manager)
  async deleteCategory(@Param('id', ParseIntPipe) id: number): Promise<void> {
    const deletedCategory = await this.categoriesService.deleteCategory(id);
    if (!deletedCategory) {
      throw new NotFoundException(['category not found']);
    }
    return;
  }

  @Get('/:id/products')
  @Roles(Role.Admin, Role.Manager, Role.Sales, Role.Customer, Role.Disabled)
  async getCategoryProducts(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Product[]> {
    return this.categoriesService.getCategoryProducts(id);
  }

  @Post('/:id/products')
  @Roles(Role.Admin, Role.Manager)
  async addCategoryProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body('productId') productId: number,
  ): Promise<Product> {
    const updatedCategory = await this.categoriesService.addCategoryProduct(
      id,
      productId,
    );
    if (!updatedCategory) {
      throw new NotFoundException(['category or product not found']);
    }
    return updatedCategory;
  }

  @Delete('/:id/products/:productId')
  @Roles(Role.Admin, Role.Manager)
  async deleteCategoryProduct(
    @Param('id', ParseIntPipe) id: number,
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<void> {
    const deleted = await this.categoriesService.deleteCategoryProduct(
      id,
      productId,
    );
    if (!deleted) {
      throw new NotFoundException(['category or product not found']);
    }
    return;
  }
}
