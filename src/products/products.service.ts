import { Injectable, StreamableFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { In, Repository } from 'typeorm';
import { ProductCreateDto } from './dto/product-create.dto';
import { ProductUpdateDto } from './dto/product-update.dto';
import { Attribute } from './entities/attribute.entity';
import { AttributeDto } from './dto/attribute.dto';
import { ProductPhoto } from './entities/product-photo.entity';
import { NotFoundError } from '../errors/not-found.error';
import {
  AttributeType,
  AttributeValueType,
} from './entities/attribute-type.entity';
import {
  isBooleanString,
  isHexColor,
  isNumberString,
  isString,
} from 'class-validator';
import { TypeCheckError } from '../errors/type-check.error';
import { parse } from 'json2csv';
import * as csv from 'csvtojson';
import { OrderItem } from '../orders/entities/order-item.entity';
import { LocalFilesService } from '../local-files/local-files.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private productsRepository: Repository<Product>,
    @InjectRepository(Attribute)
    private attributesRepository: Repository<Attribute>,
    @InjectRepository(AttributeType)
    private attributeTypesRepository: Repository<AttributeType>,
    @InjectRepository(ProductPhoto)
    private productPhotosRepository: Repository<ProductPhoto>,
    private localFilesService: LocalFilesService,
  ) {}

  async getProducts(): Promise<Product[]> {
    return this.productsRepository.find();
  }

  async getProduct(id: number): Promise<Product> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundError('product', 'id', id.toString());
    }
    return product;
  }

  async createProduct(productData: ProductCreateDto): Promise<Product> {
    const product = new Product();
    Object.assign(product, productData);
    return this.productsRepository.save(product);
  }

  async updateProduct(
    id: number,
    productData: ProductUpdateDto,
  ): Promise<Product> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundError('product', 'id', id.toString());
    }
    if (productData.photosOrder) {
      await this.checkProductPhotosOrder(product, productData.photosOrder);
    }
    Object.assign(product, productData);
    return this.productsRepository.save(product);
  }

  async checkProductPhotosOrder(product: Product, newOrder: string) {
    const photos = product.photos;
    const sortedPhotos = photos.sort((a, b) => a.id - b.id).map((p) => p.id);
    const sortedNewOrder = newOrder
      .split(',')
      .map((p) => parseInt(p))
      .sort((a, b) => a - b);
    if (sortedPhotos.join(',') !== sortedNewOrder.join(',')) {
      throw new NotFoundError('product photo');
    }
  }

  async deleteProduct(id: number): Promise<boolean> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundError('product', 'id', id.toString());
    }
    await this.productsRepository.delete({ id });
    return true;
  }

  async checkProductsStocks(items: OrderItem[]) {
    const products = await this.productsRepository.find({
      where: { id: In(items.map((i) => i.product.id)) },
    });
    for (const p of products) {
      const item = items.find((i) => i.product.id === p.id);
      if (item && p.stock < item.quantity) {
        return false;
      }
    }
    return true;
  }

  async updateProductsStocks(type: 'add' | 'subtract', items: OrderItem[]) {
    const products = await this.productsRepository.find({
      where: { id: In(items.map((i) => i.product.id)) },
    });
    for (const p of products) {
      const item = items.find((i) => i.product.id === p.id);
      if (!item) {
        continue;
      }
      if (type === 'add') {
        p.stock += item.quantity;
      } else {
        p.stock -= item.quantity;
      }
      await this.productsRepository.save(p);
    }
  }

  async updateProductAttributes(
    id: number,
    attributes: AttributeDto[],
  ): Promise<Product> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundError('product', 'id', id.toString());
    }
    const attributesToSave = [];
    for (const attribute of attributes) {
      const attributeType = await this.attributeTypesRepository.findOne({
        where: { id: attribute.typeId },
      });
      if (!attributeType) {
        throw new NotFoundError('attribute type');
      }
      await this.checkAttributeType(attributeType.valueType, attribute.value);
      const newAttribute = new Attribute();
      newAttribute.type = attributeType;
      newAttribute.value = attribute.value;
      attributesToSave.push(newAttribute);
    }
    product.attributes = await this.attributesRepository.save(attributesToSave);
    return this.productsRepository.save(product);
  }

  private async checkAttributeType(type: AttributeValueType, value: any) {
    (<[AttributeValueType, (value: any) => boolean][]>[
      [AttributeValueType.String, isString],
      [AttributeValueType.Number, isNumberString],
      [AttributeValueType.Boolean, isBooleanString],
      [AttributeValueType.Color, isHexColor],
    ]).forEach((check) => {
      if (type === check[0] && !check[1](value)) {
        throw new TypeCheckError('attribute value', check[0]);
      }
    });
  }

  async getProductPhoto(
    productId: number,
    photoId: number,
    thumbnail: boolean,
  ): Promise<StreamableFile> {
    const productPhoto = await this.productPhotosRepository.findOne({
      where: { id: photoId, product: { id: productId } },
    });
    if (!productPhoto) {
      throw new NotFoundError('product photo', 'id', photoId.toString());
    }

    const filepath = thumbnail ? productPhoto.thumbnailPath : productPhoto.path;

    const mimeType = thumbnail ? 'image/jpeg' : productPhoto.mimeType;

    return await this.localFilesService.getPhoto(filepath, mimeType);
  }

  async addProductPhoto(
    id: number,
    file: Express.Multer.File,
  ): Promise<Product> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundError('product', 'id', id.toString());
    }
    const photo = new ProductPhoto();
    const { path, mimeType } = await this.localFilesService.savePhoto(file);
    photo.path = path;
    photo.mimeType = mimeType;
    photo.thumbnailPath = await this.localFilesService.createPhotoThumbnail(
      file.path,
    );
    product.photos.push(photo);
    return this.productsRepository.save(product);
  }

  async deleteProductPhoto(id: number, photoId: number): Promise<Product> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundError('product', 'id', id.toString());
    }
    product.photos = product.photos.filter((p) => p.id !== photoId);
    return this.productsRepository.save(product);
  }

  async exportProducts(): Promise<string> {
    const products = await this.productsRepository.find();
    return parse(products);
  }

  async importProducts(data: string, replace: boolean): Promise<Product[]> {
    const products = await csv({
      checkType: true,
    }).fromString(data);
    if (!replace) {
      products.forEach((product) => {
        product.id = undefined;
        product.created = undefined;
        product.updated = undefined;
      });
    }
    for (const product of products) {
      product.attributes = product.attributes.map((attribute: Attribute) => ({
        ...attribute,
        id: undefined,
      }));
      product.photos = product.photos.map((photo: ProductPhoto) => ({
        ...photo,
        id: undefined,
      }));
    }
    return await this.productsRepository.save(products);
  }
}
