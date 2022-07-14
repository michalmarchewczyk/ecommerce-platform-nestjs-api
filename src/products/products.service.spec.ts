import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Attribute } from './entities/attribute.entity';
import { Readable } from 'stream';

describe('ProductsService', () => {
  let service: ProductsService;
  const mockProductsRepository = {
    products: [],
    save(product): Product {
      const id = product.id ?? Math.floor(Math.random() * 1000000);
      this.products.push({
        visible: true,
        attributes: [],
        photos: [],
        ...product,
        id,
      });
      return {
        visible: true,
        attributes: [],
        photos: [],
        ...product,
        id,
      } as Product;
    },
    find(): Product[] {
      return this.products;
    },
    findOne(options: { where: { id?: number } }): Product | null {
      const product = this.products.find((p) => p.id === options.where.id);
      return product ?? null;
    },
    delete(where: { id: number }): void {
      this.products = this.products.filter((p) => p.id !== where.id);
    },
  };
  const mockAttributesRepository = {
    save(attributes: Attribute[]): Attribute[] {
      return attributes;
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductsRepository,
        },
        {
          provide: getRepositoryToken(Attribute),
          useValue: mockAttributesRepository,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProducts', () => {
    it('should return all products', async () => {
      expect(await service.getProducts()).toEqual(
        mockProductsRepository.products,
      );
    });
  });

  describe('getProduct', () => {
    it('should return a product with given id', async () => {
      const product = {
        name: 'Product 1',
        description: 'Description 1',
        price: 1,
        stock: 1,
      };
      const { id } = mockProductsRepository.save(product);
      expect(await service.getProduct(id)).toEqual({
        ...product,
        id,
        visible: true,
        attributes: [],
        photos: [],
      });
    });
  });

  describe('createProduct', () => {
    it('should create a product', async () => {
      const product = {
        name: 'Product 2',
        description: 'Description 2',
        price: 2,
        stock: 2,
      };
      expect(await service.createProduct(product)).toEqual({
        ...product,
        id: expect.any(Number),
        visible: true,
        attributes: [],
        photos: [],
      });
      expect(
        mockProductsRepository.products.some((p) => p.name === product.name),
      ).toBeTruthy();
    });
  });

  describe('updateProduct', () => {
    it('should update a product', async () => {
      const product = {
        name: 'Product 3',
        description: 'Description 3',
        price: 3,
        stock: 3,
      };
      const { id } = mockProductsRepository.save(product);
      const updatedProduct = await service.updateProduct(id, {
        name: 'Product 3 Updated',
        visible: false,
      });
      expect(updatedProduct).toEqual({
        ...product,
        name: 'Product 3 Updated',
        id,
        visible: false,
        attributes: [],
        photos: [],
      });
      expect(
        mockProductsRepository.products.some(
          (p) => p.name === 'Product 3 Updated',
        ),
      ).toBeTruthy();
    });

    it('should return null if product not found', async () => {
      expect(await service.updateProduct(12345, {})).toBeNull();
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product', async () => {
      const product = {
        name: 'Product 4',
        description: 'Description 4',
        price: 4,
        stock: 4,
      };
      const { id } = mockProductsRepository.save(product);
      const deleted = await service.deleteProduct(id);
      expect(deleted).toBeTruthy();
      expect(
        mockProductsRepository.products.find((p) => p.id === id),
      ).toBeUndefined();
    });

    it('should return false if product not found', async () => {
      expect(await service.deleteProduct(12345)).toBe(false);
    });
  });

  describe('updateProductAttributes', () => {
    it('should update product attributes', async () => {
      const product = {
        name: 'Product 5',
        description: 'Description 5',
        price: 5,
        stock: 5,
      };
      const { id } = mockProductsRepository.save(product);
      await service.updateProductAttributes(id, [
        { value: 'Attribute 1', type: { id: 1 } },
        { value: 'Attribute 2', type: { id: 2 } },
      ]);
      expect(
        mockProductsRepository.products.find((p) => p.id === id)?.attributes,
      ).toEqual([
        { value: 'Attribute 1', type: { id: 1 } },
        { value: 'Attribute 2', type: { id: 2 } },
      ]);
    });

    it('should return null if product not found', async () => {
      expect(await service.updateProductAttributes(12345, [])).toBeNull();
    });
  });

  describe('addProductPhoto', () => {
    it('should add product photo', async () => {
      const product = {
        name: 'Product 6',
        description: 'Description 6',
        price: 6,
        stock: 6,
      };
      const { id } = mockProductsRepository.save(product);
      const updatedProduct = await service.addProductPhoto(id, {
        fieldname: 'file',
        originalname: 'file.jpg',
        encoding: '8bit',
        mimetype: 'image/jpeg',
        size: 1234,
        destination: './uploads',
        filename: 'filejpg',
        path: './uploads/filejpg',
        buffer: Buffer.from('file'),
        stream: new Readable(),
      });
      expect(updatedProduct.photos).toHaveLength(1);
      expect(
        mockProductsRepository.products.find((p) => p.id === id)?.photos,
      ).toEqual([
        {
          path: './uploads/filejpg',
          mimeType: 'image/jpeg',
        },
      ]);
    });

    it('should return null if product not found', async () => {
      expect(await service.addProductPhoto(12345, null)).toBeNull();
    });
  });

  describe('deleteProductPhoto', () => {
    it('should delete product photo', async () => {
      const product = {
        name: 'Product 7',
        description: 'Description 7',
        price: 7,
        stock: 7,
      };
      const { id } = mockProductsRepository.save(product);
      const photoId = (
        await service.addProductPhoto(id, {
          fieldname: 'file',
          originalname: 'file.jpg',
          encoding: '8bit',
          mimetype: 'image/jpeg',
          size: 1234,
          destination: './uploads',
          filename: 'filejpg',
          path: './uploads/filejpg',
          buffer: Buffer.from('file'),
          stream: new Readable(),
        })
      ).photos[0].id;
      const updatedProduct = await service.deleteProductPhoto(id, photoId);
      expect(updatedProduct).toBeDefined();
      expect(updatedProduct.photos).toHaveLength(0);
      expect(
        mockProductsRepository.products.find((p) => p.id === id)?.photos,
      ).toEqual([]);
    });

    it('should return null if product not found', async () => {
      expect(await service.deleteProductPhoto(12345, 12345)).toBeNull();
    });
  });
});
