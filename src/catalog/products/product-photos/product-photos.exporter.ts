import { Injectable } from '@nestjs/common';
import { ProductPhoto } from './models/product-photo.entity';
import { ProductPhotosService } from './product-photos.service';
import { Exporter } from '../../../import-export/models/exporter.interface';
import * as mime from 'mime-types';

@Injectable()
export class ProductPhotosExporter implements Exporter<ProductPhoto> {
  constructor(private productPhotosService: ProductPhotosService) {}

  async export(): Promise<ProductPhoto[]> {
    const productPhotos = await this.productPhotosService.getProductPhotos();
    productPhotos.sort((a, b) => {
      if (a.product.id !== b.product.id) {
        return a.product.id - b.product.id;
      }
      const photosOrder = a.product.photosOrder.split(',');
      return (
        photosOrder.indexOf(a.id.toString()) -
        photosOrder.indexOf(b.id.toString())
      );
    });
    const preparedProductPhotos: ProductPhoto[] = [];
    for (const productPhoto of productPhotos) {
      preparedProductPhotos.push(this.prepareProductPhoto(productPhoto));
    }
    return preparedProductPhotos;
  }

  private prepareProductPhoto(productPhoto: ProductPhoto) {
    const preparedProductPhoto = new ProductPhoto() as any;
    preparedProductPhoto.id = productPhoto.id;
    preparedProductPhoto.productId = productPhoto.product.id;
    preparedProductPhoto.path =
      productPhoto.path + '.' + mime.extension(productPhoto.mimeType);
    preparedProductPhoto.mimeType = productPhoto.mimeType;
    return preparedProductPhoto;
  }
}
