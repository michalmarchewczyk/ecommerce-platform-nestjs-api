import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { LocalFilesService } from './local-files.service';
import { createReadStream } from 'fs';
import * as path from 'path';
import { Response } from 'express';
import {
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiProduces,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Product } from '../products/entities/product.entity';
import * as tar from 'tar';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/entities/role.enum';

@Controller('files')
export class LocalFilesController {
  constructor(private readonly localFilesService: LocalFilesService) {}

  @ApiTags('products')
  @Get('/export')
  @Roles(Role.Admin, Role.Manager)
  @ApiOkResponse({ type: [Product], description: 'Products photos export' })
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  async exportProductPhotos() {
    const productPhotos = await this.localFilesService.exportProductPhotos();
    const paths: string[] = productPhotos.map(
      (productPhoto) => productPhoto.path,
    );
    const stream = tar.create({ gzip: true }, paths);
    return new StreamableFile(stream, {
      type: 'application/gzip',
      disposition: 'attachment; filename="product-photos.tar.gz"',
    });
  }

  @ApiTags('products')
  @Get('/:id')
  @ApiOkResponse({ description: 'Product photo with given id' })
  @ApiProduces('image/*')
  @ApiNotFoundResponse({ description: 'Product photo not found' })
  async getProductPhoto(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    const productPhoto = await this.localFilesService.getProductPhoto(id);

    const stream = createReadStream(
      path.join(process.cwd(), productPhoto.path),
    );

    stream.on('error', () => {
      res.sendStatus(500);
    });

    return new StreamableFile(stream, {
      type: productPhoto.mimeType,
      disposition: 'inline',
    });
  }
}
