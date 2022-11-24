import {
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { LocalFilesService } from './local-files.service';
import {
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiProduces,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import * as tar from 'tar';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/models/role.enum';
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
}
