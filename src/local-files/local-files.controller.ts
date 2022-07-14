import {
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  ParseIntPipe,
  Response,
  StreamableFile,
} from '@nestjs/common';
import { LocalFilesService } from './local-files.service';
import { createReadStream } from 'fs';
import * as path from 'path';

@Controller('files')
export class LocalFilesController {
  constructor(private readonly localFilesService: LocalFilesService) {}

  @Get('/:id')
  async getProductPhoto(
    @Param('id', ParseIntPipe) id: number,
    @Response({ passthrough: true }) res,
  ) {
    const productPhoto = await this.localFilesService.getProductPhoto(id);
    if (!productPhoto) {
      throw new NotFoundException(['product photo not found']);
    }

    try {
      const stream = createReadStream(
        path.join(process.cwd(), productPhoto.path),
      );

      stream.on('error', () => {
        res.sendStatus(500);
        res.end();
      });

      return new StreamableFile(stream, {
        type: productPhoto.mimeType,
        disposition: 'inline',
      });
    } catch (e) {
      throw new InternalServerErrorException(['could not get product photo']);
    }
  }
}
