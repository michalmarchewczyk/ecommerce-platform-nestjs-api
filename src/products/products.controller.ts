import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { Role } from '../users/entities/role.enum';
import { Roles } from '../auth/roles.decorator';
import { ProductCreateDto } from './dto/product-create.dto';
import { ProductUpdateDto } from './dto/product-update.dto';
import { AttributeDto } from './dto/attribute.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  getProducts(): Promise<Product[]> {
    return this.productsService.getProducts();
  }

  @Get('/:id')
  async getProduct(@Param('id', ParseIntPipe) id: number): Promise<Product> {
    return await this.productsService.getProduct(id);
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
    return await this.productsService.updateProduct(id, product);
  }

  @Delete('/:id')
  @Roles(Role.Admin, Role.Manager)
  async deleteProduct(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.productsService.deleteProduct(id);
  }

  @Patch('/:id/attributes')
  @Roles(Role.Admin, Role.Manager)
  async updateProductAttributes(
    @Param('id', ParseIntPipe) id: number,
    @Body() attributes: AttributeDto[],
  ): Promise<Product> {
    return await this.productsService.updateProductAttributes(id, attributes);
  }

  @Post('/:id/photos')
  @Roles(Role.Admin, Role.Manager)
  @UseInterceptors(FileInterceptor('file'))
  async addProductPhoto(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 }),
          new FileTypeValidator({ fileType: /^image\/(png|jpe?g|gif|webp)/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<Product> {
    return await this.productsService.addProductPhoto(id, file);
  }

  @Delete('/:id/photos/:photoId')
  @Roles(Role.Admin, Role.Manager)
  async deleteProductPhoto(
    @Param('id', ParseIntPipe) id: number,
    @Param('photoId', ParseIntPipe) photoId: number,
  ): Promise<Product> {
    return await this.productsService.deleteProductPhoto(id, photoId);
  }
}
