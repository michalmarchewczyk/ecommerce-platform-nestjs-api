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

@Controller('files')
export class LocalFilesController {
  constructor(private readonly localFilesService: LocalFilesService) {}

  @Get('/:id')
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
