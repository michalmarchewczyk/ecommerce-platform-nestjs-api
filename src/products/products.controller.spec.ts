import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Attribute } from './entities/attribute.entity';
import { NotFoundException } from '@nestjs/common';
import { DtoGeneratorService } from '../../test/utils/dto-generator/dto-generator.service';
import { ProductCreateDto } from './dto/product-create.dto';
import { ProductUpdateDto } from './dto/product-update.dto';
import { AttributeDto } from './dto/attribute.dto';
import { generateFileMetadata } from '../../test/utils/generate-file-metadata';

describe('ProductsController', () => {
  let controller: ProductsController;
  let generate: DtoGeneratorService['generate'];
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

  beforeAll(async () => {
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
        DtoGeneratorService,
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    generate = module
      .get<DtoGeneratorService>(DtoGeneratorService)
      .generate.bind(module.get<DtoGeneratorService>(DtoGeneratorService));
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
        ...generate(ProductCreateDto, true),
        id: 1,
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
      const createData = generate(ProductCreateDto, true);
      const created = await controller.createProduct(createData);
      expect(created).toEqual({
        ...createData,
        id: expect.any(Number),
        attributes: [],
        photos: [],
      });
    });
  });

  describe('updateProduct', () => {
    it('should update a product', async () => {
      const createData = generate(ProductCreateDto, true);
      const { id } = await controller.createProduct(createData);
      const updateData = generate(ProductUpdateDto, true);
      const updated = await controller.updateProduct(id, updateData);
      expect(updated).toEqual({
        ...updateData,
        id: expect.any(Number),
        attributes: [],
        photos: [],
      });
    });

    it('should throw error when product not found', async () => {
      await expect(controller.updateProduct(12345, {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product', async () => {
      const createData = generate(ProductCreateDto);
      const { id } = await controller.createProduct(createData);
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
      const createData = generate(ProductCreateDto, true);
      const { id } = await controller.createProduct(createData);
      const attributesData = generate(AttributeDto, false, 4);
      const updated = await controller.updateProductAttributes(
        id,
        attributesData,
      );
      const expectedAttributes = attributesData.map((a) => ({
        value: a.value,
        type: { id: a.typeId },
      }));
      expect(updated).toEqual({
        ...createData,
        id: expect.any(Number),
        photos: [],
        attributes: expectedAttributes,
      });
    });

    it('should throw error when product not found', async () => {
      await expect(
        controller.updateProductAttributes(12345, []),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addProductPhoto', () => {
    it('should add product photo', async () => {
      const createData = generate(ProductCreateDto);
      const { id } = mockProductsRepository.save(createData);
      const fileMetadata = generateFileMetadata();
      const updated = await controller.addProductPhoto(id, fileMetadata);
      expect(updated.photos).toHaveLength(1);
      expect(
        mockProductsRepository.products.find((p) => p.id === id)?.photos,
      ).toEqual([
        {
          path: fileMetadata.path,
          mimeType: 'image/jpeg',
        },
      ]);
    });

    it('should throw error when product not found', async () => {
      await expect(controller.addProductPhoto(12345, null)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteProductPhoto', () => {
    it('should delete product photo', async () => {
      const createData = generate(ProductCreateDto);
      const { id } = mockProductsRepository.save(createData);
      const photoId = (
        await controller.addProductPhoto(id, generateFileMetadata())
      ).photos[0].id;
      const updated = await controller.deleteProductPhoto(id, photoId);
      expect(updated).toBeDefined();
      expect(updated.photos).toHaveLength(0);
      expect(
        mockProductsRepository.products.find((p) => p.id === id)?.photos,
      ).toEqual([]);
    });

    it('should throw error when product not found', async () => {
      await expect(controller.deleteProductPhoto(12345, 12345)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
