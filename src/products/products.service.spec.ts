import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Attribute } from './entities/attribute.entity';
import { DtoGeneratorService } from '../../test/utils/dto-generator/dto-generator.service';
import { ProductCreateDto } from './dto/product-create.dto';
import { ProductUpdateDto } from './dto/product-update.dto';
import { AttributeDto } from './dto/attribute.dto';
import { generateFileMetadata } from '../../test/utils/generate-file-metadata';

describe('ProductsService', () => {
  let service: ProductsService;
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

    service = module.get<ProductsService>(ProductsService);
    generate = module
      .get<DtoGeneratorService>(DtoGeneratorService)
      .generate.bind(module.get<DtoGeneratorService>(DtoGeneratorService));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProducts', () => {
    it('should return all products', async () => {
      const products = await service.getProducts();
      expect(products).toEqual(mockProductsRepository.products);
    });
  });

  describe('getProduct', () => {
    it('should return a product with given id', async () => {
      const createData = generate(ProductCreateDto);
      const { id } = mockProductsRepository.save(createData);
      const product = await service.getProduct(id);
      expect(product).toEqual({
        ...createData,
        id,
        visible: true,
        attributes: [],
        photos: [],
      });
    });
  });

  describe('createProduct', () => {
    it('should create a product', async () => {
      const createData = generate(ProductCreateDto);
      const created = await service.createProduct(createData);
      expect(created).toEqual({
        ...createData,
        id: expect.any(Number),
        visible: true,
        attributes: [],
        photos: [],
      });
      expect(
        mockProductsRepository.products.some((p) => p.name === createData.name),
      ).toBeTruthy();
    });
  });

  describe('updateProduct', () => {
    it('should update a product', async () => {
      const createData = generate(ProductCreateDto);
      const { id } = mockProductsRepository.save(createData);
      const updateData = generate(ProductUpdateDto, true);
      const updated = await service.updateProduct(id, updateData);
      expect(updated).toEqual({
        ...updateData,
        id,
        attributes: [],
        photos: [],
      });
      expect(
        mockProductsRepository.products.some((p) => p.name === updateData.name),
      ).toBeTruthy();
    });

    it('should return null if product not found', async () => {
      const updated = await service.updateProduct(12345, {});
      expect(updated).toBeNull();
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product', async () => {
      const createData = generate(ProductCreateDto);
      const { id } = mockProductsRepository.save(createData);
      const deleted = await service.deleteProduct(id);
      expect(deleted).toBe(true);
      expect(
        mockProductsRepository.products.find((p) => p.id === id),
      ).toBeUndefined();
    });

    it('should return false if product not found', async () => {
      const deleted = await service.deleteProduct(12345);
      expect(deleted).toBe(false);
    });
  });

  describe('updateProductAttributes', () => {
    it('should update product attributes', async () => {
      const product = generate(ProductCreateDto, true);
      const { id } = mockProductsRepository.save(product);
      const attributes = generate(AttributeDto, false, 4);
      const updated = await service.updateProductAttributes(id, attributes);
      const expectedAttributes = attributes.map((a) => ({
        value: a.value,
        type: { id: a.typeId },
      }));
      expect(updated).toEqual({
        ...product,
        id,
        attributes: expectedAttributes,
        photos: [],
      });
      expect(
        mockProductsRepository.products.find((p) => p.id === id)?.attributes,
      ).toEqual(expectedAttributes);
    });

    it('should return null if product not found', async () => {
      const updated = await service.updateProductAttributes(12345, []);
      expect(updated).toBeNull();
    });
  });

  describe('addProductPhoto', () => {
    it('should add product photo', async () => {
      const product = generate(ProductCreateDto);
      const { id } = mockProductsRepository.save(product);
      const fileMetadata = generateFileMetadata();
      const updated = await service.addProductPhoto(id, fileMetadata);
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

    it('should return null if product not found', async () => {
      const updated = await service.addProductPhoto(12345, null);
      expect(updated).toBeNull();
    });
  });

  describe('deleteProductPhoto', () => {
    it('should delete product photo', async () => {
      const createData = generate(ProductCreateDto);
      const { id } = mockProductsRepository.save(createData);
      const photoId = (
        await service.addProductPhoto(id, generateFileMetadata())
      ).photos[0].id;
      const updated = await service.deleteProductPhoto(id, photoId);
      expect(updated).toBeDefined();
      expect(updated.photos).toHaveLength(0);
      expect(
        mockProductsRepository.products.find((p) => p.id === id)?.photos,
      ).toEqual([]);
    });

    it('should return null if product not found', async () => {
      const updated = await service.deleteProductPhoto(12345, 12345);
      expect(updated).toBeNull();
    });
  });
});
