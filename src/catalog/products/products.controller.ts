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
import { ProductsService } from './products.service';
import { Product } from './models/product.entity';
import { Role } from '../../users/models/role.enum';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ProductCreateDto } from './dto/product-create.dto';
import { ProductUpdateDto } from './dto/product-update.dto';
import { AttributeDto } from './dto/attribute.dto';
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
import { ReqUser } from '../../auth/decorators/user.decorator';
import { User } from '../../users/models/user.entity';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  @ApiOkResponse({ type: [Product], description: 'List of all products' })
  getProducts(@ReqUser() user?: User): Promise<Product[]> {
    if (user && [Role.Admin, Role.Manager, Role.Sales].includes(user?.role)) {
      return this.productsService.getProducts(true);
    }
    return this.productsService.getProducts();
  }

  @Get('/:id')
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiOkResponse({ type: Product, description: 'Product with given id' })
  async getProduct(
    @Param('id', ParseIntPipe) id: number,
    @ReqUser() user?: User,
  ): Promise<Product> {
    if (user && [Role.Admin, Role.Manager, Role.Sales].includes(user?.role)) {
      return this.productsService.getProduct(id, true);
    }
    return await this.productsService.getProduct(id);
  }

  @Post()
  @Roles(Role.Admin, Role.Manager)
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiCreatedResponse({ type: Product, description: 'Product created' })
  @ApiBadRequestResponse({ description: 'Invalid product data' })
  createProduct(@Body() product: ProductCreateDto): Promise<Product> {
    return this.productsService.createProduct(product);
  }

  @Patch('/:id')
  @Roles(Role.Admin, Role.Manager)
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiOkResponse({ type: Product, description: 'Product updated' })
  @ApiBadRequestResponse({ description: 'Invalid product data' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  async updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() product: ProductUpdateDto,
  ): Promise<Product> {
    return await this.productsService.updateProduct(id, product);
  }

  @Delete('/:id')
  @Roles(Role.Admin, Role.Manager)
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiOkResponse({ description: 'Product deleted' })
  async deleteProduct(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.productsService.deleteProduct(id);
  }

  @Patch('/:id/attributes')
  @Roles(Role.Admin, Role.Manager)
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiOkResponse({ type: Product, description: 'Product attributes updated' })
  @ApiBody({ type: [AttributeDto] })
  async updateProductAttributes(
    @Param('id', ParseIntPipe) id: number,
    @Body() attributes: AttributeDto[],
  ): Promise<Product> {
    return await this.productsService.updateProductAttributes(id, attributes);
  }
}
