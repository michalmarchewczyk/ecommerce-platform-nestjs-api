import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Attribute } from './entities/attribute.entity';
import { NotFoundException } from '@nestjs/common';

describe('ProductsController', () => {
  let controller: ProductsController;
  const mockProductsRepository = {
    products: [],
    save(product): Product {
      const id = product.id ?? Math.floor(Math.random() * 1000000);
      this.products.push({ visible: true, attributes: [], ...product, id });
      return { visible: true, attributes: [], ...product, id } as Product;
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
      controllers: [ProductsController],
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

    controller = module.get<ProductsController>(ProductsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProducts', () => {
    it('should return all products', async () => {
      expect(await controller.getProducts()).toEqual(
        mockProductsRepository.products,
      );
    });
  });

  describe('getProduct', () => {
    it('should return a product with given id', async () => {
      const product = {
        id: 1,
        name: 'Product 1',
        description: 'Description 1',
        price: 1,
        visible: true,
        attributes: [],
      };
      mockProductsRepository.products.push(product);
      expect(await controller.getProduct(1)).toEqual(product);
    });

    it('should return null if product not found', async () => {
      await expect(controller.getProduct(12345)).rejects.toThrow(
        NotFoundException,
      );
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
      expect(await controller.createProduct(product)).toEqual({
        ...product,
        id: expect.any(Number),
        visible: true,
        attributes: [],
      });
    });
  });

  describe('updateProduct', () => {
    it('should update a product', async () => {
      const product = {
        name: 'Product 3',
        description: 'Description 3',
        price: 1,
        stock: 1,
      };
      const { id } = await controller.createProduct(product);
      const updatedProduct = {
        name: 'Product 3 updated',
        visible: false,
      };
      expect(await controller.updateProduct(id, updatedProduct)).toEqual({
        ...product,
        id: expect.any(Number),
        name: 'Product 3 updated',
        visible: false,
        attributes: [],
      });
    });

    it('should throw error when product not found', async () => {
      await expect(
        controller.updateProduct(12345, { name: 'Product 2 updated' }),
      ).rejects.toThrow(NotFoundException);
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
      const { id } = await controller.createProduct(product);
      await controller.deleteProduct(id);
      expect(
        mockProductsRepository.products.find((p) => p.id === id),
      ).toBeUndefined();
    });

    it('should throw error when product not found', async () => {
      await expect(controller.deleteProduct(12345)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProductAttributes', () => {
    it('should update a product attributes', async () => {
      const product = {
        name: 'Product 5',
        description: 'Description 5',
        price: 5,
        stock: 5,
      };
      const { id } = await controller.createProduct(product);
      const attributes = [
        { value: 'Attribute 1', type: { id: 1 } },
        { value: 'Attribute 2', type: { id: 1 } },
      ];
      expect(await controller.updateProductAttributes(id, attributes)).toEqual({
        ...product,
        id: expect.any(Number),
        visible: true,
        attributes,
      });
    });

    it('should throw error when product not found', async () => {
      await expect(
        controller.updateProductAttributes(12345, []),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
