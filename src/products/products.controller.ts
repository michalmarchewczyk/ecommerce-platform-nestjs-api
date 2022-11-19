import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  Header,
  MaxFileSizeValidator,
  Param,
  ParseBoolPipe,
  ParseFilePipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { Role } from '../users/entities/role.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { ProductCreateDto } from './dto/product-create.dto';
import { ProductUpdateDto } from './dto/product-update.dto';
import { AttributeDto } from './dto/attribute.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiProduces,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import * as multer from 'multer';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  @ApiOkResponse({ type: [Product], description: 'List of all products' })
  getProducts(): Promise<Product[]> {
    return this.productsService.getProducts();
  }

  @Get('/export')
  @Roles(Role.Admin, Role.Manager)
  @ApiOkResponse({ type: [Product], description: 'Products exported' })
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename=products.csv')
  async exportProducts(): Promise<string> {
    return await this.productsService.exportProducts();
  }

  @Post('/import')
  @Roles(Role.Admin, Role.Manager)
  @ApiCreatedResponse({ type: [Product], description: 'Products imported' })
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('data', {
      storage: multer.memoryStorage(),
    }),
  )
  async importProducts(
    @Query('replace') replace = false,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 }),
          new FileTypeValidator({ fileType: 'text/csv' }),
        ],
      }),
    )
    data: Express.Multer.File,
  ): Promise<Product[]> {
    const csv = data.buffer.toString('utf-8');
    return await this.productsService.importProducts(csv, replace);
  }

  @Get('/:id')
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiOkResponse({ type: Product, description: 'Product with given id' })
  async getProduct(@Param('id', ParseIntPipe) id: number): Promise<Product> {
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

  @Get('/:id/photos/:photoId')
  @ApiOkResponse({
    schema: {
      type: 'string',
      format: 'binary',
    },
    description: 'Product photo with given id',
  })
  @ApiProduces('image/*')
  @ApiNotFoundResponse({ description: 'Product photo not found' })
  async getProductPhoto(
    @Param('id', ParseIntPipe) id: number,
    @Param('photoId', ParseIntPipe) photoId: number,
    @Query('thumbnail', ParseBoolPipe) thumbnail?: boolean,
  ): Promise<StreamableFile> {
    return await this.productsService.getProductPhoto(
      id,
      photoId,
      thumbnail ?? false,
    );
  }

  @Post('/:id/photos')
  @Roles(Role.Admin, Role.Manager)
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiCreatedResponse({ type: Product, description: 'Product photo added' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
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
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiOkResponse({ type: Product, description: 'Product photo deleted' })
  async deleteProductPhoto(
    @Param('id', ParseIntPipe) id: number,
    @Param('photoId', ParseIntPipe) photoId: number,
  ): Promise<Product> {
    return await this.productsService.deleteProductPhoto(id, photoId);
  }
}
