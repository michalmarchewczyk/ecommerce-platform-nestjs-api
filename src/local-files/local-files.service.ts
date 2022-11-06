import { Injectable, StreamableFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductPhoto } from '../products/entities/product-photo.entity';
import { Repository } from 'typeorm';
import * as sharp from 'sharp';
import { createReadStream } from 'fs';
import * as path from 'path';

@Injectable()
export class LocalFilesService {
  constructor(
    @InjectRepository(ProductPhoto)
    private productPhotosRepository: Repository<ProductPhoto>,
  ) {}

  async getPhoto(filepath: string, mimeType = 'image/jpeg') {
    const stream = createReadStream(path.join(process.cwd(), filepath));

    const res = new StreamableFile(stream, {
      type: mimeType,
      disposition: 'inline',
    });

    res.setErrorHandler((err, response) => {
      response.send('ERROR');
    });

    return res;
  }

  async createPhotoThumbnail(path: string): Promise<string> {
    const outputPath = `${path}-thumbnail`;
    await sharp(path)
      .resize(200, 200, { fit: 'contain', background: '#ffffff' })
      .jpeg({ quality: 80 })
      .toFile(outputPath);
    return outputPath;
  }

  async exportProductPhotos(): Promise<ProductPhoto[]> {
    return this.productPhotosRepository.find();
  }
}
