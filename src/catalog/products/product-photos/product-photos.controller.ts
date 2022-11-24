import {
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseBoolPipe,
  ParseFilePipe,
  ParseIntPipe,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
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
import { Roles } from '../../../auth/decorators/roles.decorator';
import { Role } from '../../../users/models/role.enum';
import { Product } from '../models/product.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductPhotosService } from './product-photos.service';
import { fileBodySchema } from '../../../local-files/models/file-body.schema';
import { fileResponseSchema } from '../../../local-files/models/file-response.schema';

@ApiTags('products')
@Controller('products/:id')
export class ProductPhotosController {
  constructor(private productPhotosService: ProductPhotosService) {}

  @Get('photos/:photoId')
  @ApiOkResponse({
    schema: fileResponseSchema,
    description: 'Product photo with given id',
  })
  @ApiProduces('image/*')
  @ApiNotFoundResponse({ description: 'Product photo not found' })
  async getProductPhoto(
    @Param('id', ParseIntPipe) id: number,
    @Param('photoId', ParseIntPipe) photoId: number,
    @Query('thumbnail', ParseBoolPipe) thumbnail: boolean,
  ): Promise<StreamableFile> {
    return await this.productPhotosService.getProductPhoto(
      id,
      photoId,
      thumbnail,
    );
  }

  @Post('photos')
  @Roles(Role.Admin, Role.Manager)
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiCreatedResponse({ type: Product, description: 'Product photo added' })
  @ApiBody({ schema: fileBodySchema })
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
    return await this.productPhotosService.addProductPhoto(id, file);
  }

  @Delete('photos/:photoId')
  @Roles(Role.Admin, Role.Manager)
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiOkResponse({ type: Product, description: 'Product photo deleted' })
  async deleteProductPhoto(
    @Param('id', ParseIntPipe) id: number,
    @Param('photoId', ParseIntPipe) photoId: number,
  ): Promise<Product> {
    return await this.productPhotosService.deleteProductPhoto(id, photoId);
  }
}
