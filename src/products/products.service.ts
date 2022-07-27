import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
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
import { isBoolean, isHexColor, isNumber, isString } from 'class-validator';
import { TypeCheckError } from '../errors/type-check.error';
import { parse } from 'json2csv';
import * as csv from 'csvtojson';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private productsRepository: Repository<Product>,
    @InjectRepository(Attribute)
    private attributesRepository: Repository<Attribute>,
    @InjectRepository(AttributeType)
    private attributeTypesRepository: Repository<AttributeType>,
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
    Object.assign(product, productData);
    return this.productsRepository.save(product);
  }

  async deleteProduct(id: number): Promise<boolean> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundError('product', 'id', id.toString());
    }
    await this.productsRepository.delete({ id });
    return true;
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
      [AttributeValueType.Number, isNumber],
      [AttributeValueType.Boolean, isBoolean],
      [AttributeValueType.Color, isHexColor],
    ]).forEach((check) => {
      if (type === check[0] && !check[1](value)) {
        throw new TypeCheckError('attribute value', check[0]);
      }
    });
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
    photo.path = file.path;
    photo.mimeType = file.mimetype;
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
