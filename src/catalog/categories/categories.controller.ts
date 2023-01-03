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
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../users/models/role.enum';
import { CategoryCreateDto } from './dto/category-create.dto';
import { CategoryUpdateDto } from './dto/category-update.dto';
import { Product } from '../products/models/product.entity';
import { Category } from './models/category.entity';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CategoryGroup } from './models/category-group.entity';
import { User } from '../../users/models/user.entity';
import { ReqUser } from '../../auth/decorators/user.decorator';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  @ApiOkResponse({ type: [Category], description: 'List of all categories' })
  async getCategories(): Promise<Category[]> {
    return this.categoriesService.getCategories();
  }

  @Get('/groups')
  @ApiOkResponse({
    type: [CategoryGroup],
    description: 'List of all category groups',
  })
  async getCategoryGroups(): Promise<CategoryGroup[]> {
    return await this.categoriesService.getCategoryGroups();
  }

  @Get('/:id')
  @ApiNotFoundResponse({ description: 'Category not found' })
  @ApiOkResponse({ type: Category, description: 'Category with given id' })
  async getCategory(@Param('id', ParseIntPipe) id: number): Promise<Category> {
    return await this.categoriesService.getCategory(id);
  }

  @Post()
  @Roles(Role.Admin, Role.Manager)
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiCreatedResponse({ type: Category, description: 'Category created' })
  @ApiBadRequestResponse({ description: 'Invalid category data' })
  async createCategory(@Body() category: CategoryCreateDto): Promise<Category> {
    return await this.categoriesService.createCategory(category);
  }

  @Patch('/:id')
  @Roles(Role.Admin, Role.Manager)
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiBadRequestResponse({ description: 'Invalid category data' })
  @ApiOkResponse({ type: Category, description: 'Category updated' })
  @ApiNotFoundResponse({ description: 'Category not found' })
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() category: CategoryUpdateDto,
  ): Promise<Category> {
    return await this.categoriesService.updateCategory(id, category);
  }

  @Delete('/:id')
  @Roles(Role.Admin, Role.Manager)
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiOkResponse({ type: Category, description: 'Category deleted' })
  @ApiNotFoundResponse({ description: 'Category not found' })
  async deleteCategory(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.categoriesService.deleteCategory(id);
  }

  @Get('/:id/products')
  @ApiNotFoundResponse({ description: 'Category not found' })
  @ApiOkResponse({ type: [Product], description: 'Category products' })
  async getCategoryProducts(
    @Param('id', ParseIntPipe) id: number,
    @ReqUser() user?: User,
  ): Promise<Product[]> {
    if (user && [Role.Admin, Role.Manager, Role.Sales].includes(user?.role)) {
      return await this.categoriesService.getCategoryProducts(id, true);
    }
    return await this.categoriesService.getCategoryProducts(id);
  }

  @Post('/:id/products')
  @Roles(Role.Admin, Role.Manager)
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiNotFoundResponse({ description: 'Category not found' })
  @ApiCreatedResponse({
    type: Product,
    description: 'Product added to category',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        productId: { type: 'number' },
      },
      required: ['productId'],
    },
  })
  async addCategoryProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body('productId') productId: number,
  ): Promise<Product> {
    return await this.categoriesService.addCategoryProduct(id, productId);
  }

  @Delete('/:id/products/:productId')
  @Roles(Role.Admin, Role.Manager)
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiNotFoundResponse({ description: 'Category not found' })
  @ApiOkResponse({ description: 'Product deleted from category' })
  async deleteCategoryProduct(
    @Param('id', ParseIntPipe) id: number,
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<void> {
    await this.categoriesService.deleteCategoryProduct(id, productId);
  }
}
