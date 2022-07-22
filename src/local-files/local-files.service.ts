import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductPhoto } from '../products/entities/product-photo.entity';
import { Repository } from 'typeorm';

@Injectable()
export class LocalFilesService {
  constructor(
    @InjectRepository(ProductPhoto)
    private productPhotosRepository: Repository<ProductPhoto>,
  ) {}

  async getProductPhoto(id: number): Promise<ProductPhoto | null> {
    const productPhoto = await this.productPhotosRepository.findOne({
      where: { id },
    });
    if (!productPhoto) {
      return null;
    }
    return productPhoto;
  }
}
