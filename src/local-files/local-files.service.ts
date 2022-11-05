import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductPhoto } from '../products/entities/product-photo.entity';
import { Repository } from 'typeorm';
import { NotFoundError } from '../errors/not-found.error';
import * as sharp from 'sharp';

@Injectable()
export class LocalFilesService {
  constructor(
    @InjectRepository(ProductPhoto)
    private productPhotosRepository: Repository<ProductPhoto>,
  ) {}

  async getProductPhoto(id: number): Promise<ProductPhoto> {
    const productPhoto = await this.productPhotosRepository.findOne({
      where: { id },
    });
    if (!productPhoto) {
      throw new NotFoundError('product photo', 'id', id.toString());
    }
    return productPhoto;
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
