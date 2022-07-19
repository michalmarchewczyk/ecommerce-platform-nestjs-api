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
import { RepositoryMockService } from '../../test/utils/repository-mock/repository-mock.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let generate: DtoGeneratorService['generate'];
  let mockProductsRepository: RepositoryMockService<Product>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        RepositoryMockService.getProvider(Product),
        RepositoryMockService.getProvider(Attribute),
        DtoGeneratorService,
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    generate = module
      .get<DtoGeneratorService>(DtoGeneratorService)
      .generate.bind(module.get<DtoGeneratorService>(DtoGeneratorService));
    mockProductsRepository = module.get(getRepositoryToken(Product));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProducts', () => {
    it('should return all products', async () => {
      const products = await service.getProducts();
      expect(products).toEqual(mockProductsRepository.find());
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
        created: expect.any(Date),
        updated: expect.any(Date),
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
        created: expect.any(Date),
        updated: expect.any(Date),
      });
      expect(
        mockProductsRepository.entities.some((p) => p.name === createData.name),
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
        created: expect.any(Date),
        updated: expect.any(Date),
      });
      expect(
        mockProductsRepository.entities.some((p) => p.name === updateData.name),
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
        mockProductsRepository.entities.find((p) => p.id === id),
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
      const attributesData = generate(AttributeDto, false, 4);
      const updated = await service.updateProductAttributes(id, attributesData);
      const expectedAttributes = attributesData.map((a) => ({
        id: expect.any(Number),
        value: a.value,
        type: { id: a.typeId },
        product: null,
      }));
      expect(updated).toEqual({
        ...product,
        id,
        attributes: expectedAttributes,
        photos: [],
        created: expect.any(Date),
        updated: expect.any(Date),
      });
      expect(
        mockProductsRepository.entities.find((p) => p.id === id)?.attributes,
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
        mockProductsRepository.entities.find((p) => p.id === id)?.photos,
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
        mockProductsRepository.entities.find((p) => p.id === id)?.photos,
      ).toEqual([]);
    });

    it('should return null if product not found', async () => {
      const updated = await service.deleteProductPhoto(12345, 12345);
      expect(updated).toBeNull();
    });
  });
});
