import {
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Post,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { LocalFilesService } from './local-files.service';
import { createReadStream } from 'fs';
import * as path from 'path';
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
import * as tar from 'tar';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/entities/role.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { Readable } from 'stream';

@Controller('files')
export class LocalFilesController {
  constructor(private readonly localFilesService: LocalFilesService) {}

  @ApiTags('products')
  @Get('/export')
  @Roles(Role.Admin, Role.Manager)
  @ApiOkResponse({
    schema: {
      type: 'string',
      format: 'binary',
    },
    description: 'Products photos exported',
  })
  @ApiProduces('application/gzip')
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
  @Post('/import')
  @Roles(Role.Admin, Role.Manager)
  @ApiCreatedResponse({
    type: undefined,
    description: 'Products photos imported',
  })
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
  async importProductPhotos(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 }),
          new FileTypeValidator({ fileType: 'application/gzip' }),
        ],
      }),
    )
    data: Express.Multer.File,
  ): Promise<void> {
    const stream = Readable.from(data.buffer);
    stream.pipe(tar.extract({}));
  }

  @ApiTags('products')
  @Get('/:id')
  @ApiOkResponse({
    schema: {
      type: 'string',
      format: 'binary',
    },
    description: 'Product photo with given id',
  })
  @ApiProduces('image/*')
  @ApiNotFoundResponse({ description: 'Product photo not found' })
  async getProductPhoto(@Param('id', ParseIntPipe) id: number) {
    const productPhoto = await this.localFilesService.getProductPhoto(id);

    const stream = createReadStream(
      path.join(process.cwd(), productPhoto.path),
    );

    const res = new StreamableFile(stream, {
      type: productPhoto.mimeType,
      disposition: 'inline',
    });

    res.setErrorHandler((err, response) => {
      response.send('ERROR');
    });

    return res;
  }

  @ApiTags('products')
  @Get('/:id/thumb')
  @ApiOkResponse({
    schema: {
      type: 'string',
      format: 'binary',
    },
    description: 'Product photo thumbnail with given id',
  })
  @ApiProduces('image/jpeg')
  @ApiNotFoundResponse({ description: 'Product photo not found' })
  async getProductPhotoThumbnail(@Param('id', ParseIntPipe) id: number) {
    const productPhoto = await this.localFilesService.getProductPhoto(id);

    const stream = createReadStream(
      path.join(process.cwd(), productPhoto.thumbnailPath),
    );

    const res = new StreamableFile(stream, {
      type: productPhoto.mimeType,
      disposition: 'inline',
    });

    res.setErrorHandler((err, response) => {
      response.send('ERROR');
    });

    return res;
  }
}
