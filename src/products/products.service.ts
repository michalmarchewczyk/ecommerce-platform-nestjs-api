import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { QueryFailedError, Repository } from 'typeorm';
import { ProductCreateDto } from './dto/product-create.dto';
import { ProductUpdateDto } from './dto/product-update.dto';
import { Attribute } from './entities/attribute.entity';
import { AttributeDto } from './dto/attribute.dto';
import { ProductPhoto } from './entities/product-photo.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private productsRepository: Repository<Product>,
    @InjectRepository(Attribute)
    private attributesRepository: Repository<Attribute>,
  ) {}

  async getProducts(): Promise<Product[]> {
    return this.productsRepository.find();
  }

  async getProduct(id: number): Promise<Product> {
    return this.productsRepository.findOne({ where: { id } });
  }

  async createProduct(productData: ProductCreateDto): Promise<Product> {
    const product = new Product();
    Object.assign(product, productData);
    return this.productsRepository.save(product);
  }

  async updateProduct(
    id: number,
    productData: ProductUpdateDto,
  ): Promise<Product | null> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      return null;
    }
    Object.assign(product, productData);
    return this.productsRepository.save(product);
  }

  async deleteProduct(id: number): Promise<boolean> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      return false;
    }
    await this.productsRepository.delete({ id });
    return true;
  }

  async updateProductAttributes(
    id: number,
    attributes: AttributeDto[],
  ): Promise<Product | null> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      return null;
    }
    try {
      // TODO: type-check attribute values
      const attributesToSave = attributes.map((a) => ({
        value: a.value,
        type: { id: a.typeId },
      }));
      product.attributes = await this.attributesRepository.save(
        attributesToSave,
      );
    } catch (e) {
      if (e instanceof QueryFailedError) {
        throw new BadRequestException(['wrong attribute type']);
      }
    }

    return this.productsRepository.save(product);
  }

  async addProductPhoto(
    id: number,
    file: Express.Multer.File,
  ): Promise<Product | null> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      return null;
    }
    const photo = new ProductPhoto();
    photo.path = file.path;
    photo.mimeType = file.mimetype;
    product.photos.push(photo);
    return this.productsRepository.save(product);
  }

  async deleteProductPhoto(
    id: number,
    photoId: number,
  ): Promise<Product | null> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      return null;
    }
    product.photos = product.photos.filter((p) => p.id !== photoId);
    return this.productsRepository.save(product);
  }
}
