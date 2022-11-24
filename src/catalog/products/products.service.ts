import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './models/product.entity';
import { In, Repository } from 'typeorm';
import { ProductCreateDto } from './dto/product-create.dto';
import { ProductUpdateDto } from './dto/product-update.dto';
import { Attribute } from './models/attribute.entity';
import { AttributeDto } from './dto/attribute.dto';
import { NotFoundError } from '../../errors/not-found.error';
import { AttributeType } from '../attribute-types/models/attribute-type.entity';
import {
  isBooleanString,
  isHexColor,
  isNumberString,
  isString,
} from 'class-validator';
import { TypeCheckError } from '../../errors/type-check.error';
import { OrderItem } from '../../sales/orders/models/order-item.entity';
import { AttributeValueType } from '../attribute-types/models/attribute-value-type.enum';

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
}
