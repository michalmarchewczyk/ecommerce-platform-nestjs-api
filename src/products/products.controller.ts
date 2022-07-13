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
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { Role } from '../users/entities/role.enum';
import { Roles } from '../auth/roles.decorator';
import { ProductCreateDto } from './dto/product-create.dto';
import { ProductUpdateDto } from './dto/product-update.dto';
import { AttributeDto } from './dto/attribute.dto';

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  @Roles(Role.Admin, Role.Manager, Role.Sales, Role.Customer)
  getProducts(): Promise<Product[]> {
    return this.productsService.getProducts();
  }

  @Get('/:id')
  @Roles(Role.Admin, Role.Manager, Role.Sales, Role.Customer)
  getProduct(@Param('id', ParseIntPipe) id: number): Promise<Product> {
    return this.productsService.getProduct(id);
  }

  @Post()
  @Roles(Role.Admin, Role.Manager)
  createProduct(@Body() product: ProductCreateDto): Promise<Product> {
    return this.productsService.createProduct(product);
  }

  @Patch('/:id')
  @Roles(Role.Admin, Role.Manager)
  async updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() product: ProductUpdateDto,
  ): Promise<Product> {
    const updatedProduct = await this.productsService.updateProduct(
      id,
      product,
    );
    if (!updatedProduct) {
      throw new NotFoundException(['product not found']);
    }
    return updatedProduct;
  }

  @Delete('/:id')
  @Roles(Role.Admin, Role.Manager)
  async deleteProduct(@Param('id', ParseIntPipe) id: number): Promise<void> {
    const deletedProduct = await this.productsService.deleteProduct(id);
    if (!deletedProduct) {
      throw new NotFoundException(['product not found']);
    }
    return;
  }

  @Patch('/:id/attributes')
  @Roles(Role.Admin, Role.Manager)
  async updateProductAttributes(
    @Param('id', ParseIntPipe) id: number,
    @Body() attributes: AttributeDto[],
  ): Promise<Product> {
    const updatedProduct = await this.productsService.updateProductAttributes(
      id,
      attributes,
    );
    if (!updatedProduct) {
      throw new NotFoundException(['product not found']);
    }
    return updatedProduct;
  }
}
