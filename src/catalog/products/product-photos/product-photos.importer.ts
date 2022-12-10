import { Injectable } from '@nestjs/common';
import { ProductPhotosService } from './product-photos.service';
import { ProductPhoto } from './models/product-photo.entity';
import { Importer } from '../../../import-export/models/importer.interface';
import { Collection } from '../../../import-export/models/collection.type';
import { IdMap } from '../../../import-export/models/id-map.type';
import { ParseError } from '../../../errors/parse.error';
import { Product } from '../models/product.entity';

@Injectable()
export class ProductPhotosImporter implements Importer {
  constructor(private productPhotosService: ProductPhotosService) {}

  async import(
    productPhotos: Collection,
    idMaps: Record<string, IdMap>,
  ): Promise<IdMap> {
    const parsedProductPhotos = this.parseProductPhotos(
      productPhotos,
      idMaps.products,
    );
    const idMap: IdMap = {};
    for (const productPhoto of parsedProductPhotos) {
      const { id: newId } = await this.productPhotosService.createProductPhoto(
        productPhoto.product.id,
        productPhoto.path,
        productPhoto.mimeType,
      );
      idMap[productPhoto.id] = newId;
    }
    return idMap;
  }

  async clear() {
    const productPhotos = await this.productPhotosService.getProductPhotos();
    let deleted = 0;
    for (const productPhoto of productPhotos) {
      await this.productPhotosService.deleteProductPhoto(
        productPhoto.product.id,
        productPhoto.id,
      );
      deleted += 1;
    }
    return deleted;
  }

  private parseProductPhotos(productPhotos: Collection, productsIdMap: IdMap) {
    const parsedProductPhotos: ProductPhoto[] = [];
    for (const productPhoto of productPhotos) {
      parsedProductPhotos.push(
        this.parseProductPhoto(productPhoto, productsIdMap),
      );
    }
    return parsedProductPhotos;
  }

  private parseProductPhoto(
    productPhoto: Collection[number],
    productsIdMap: IdMap,
  ) {
    const parsedProductPhoto = new ProductPhoto();
    try {
      parsedProductPhoto.id = productPhoto.id as number;
      parsedProductPhoto.product = {
        id: productsIdMap[productPhoto.productId as number],
      } as Product;
      parsedProductPhoto.path = productPhoto.path as string;
      parsedProductPhoto.mimeType = productPhoto.mimeType as string;
    } catch (e) {
      throw new ParseError('product-photo');
    }
    return parsedProductPhoto;
  }
}
