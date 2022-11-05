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
import { NotFoundError } from '../errors/not-found.error';
import {
  AttributeType,
  AttributeValueType,
} from './entities/attribute-type.entity';
import { AttributeTypeDto } from './dto/attribute-type.dto';
import { LocalFilesService } from '../local-files/local-files.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let generate: DtoGeneratorService['generate'];
  let mockProductsRepository: RepositoryMockService<Product>;
  let mockAttributesTypesRepository: RepositoryMockService<AttributeType>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        RepositoryMockService.getProvider(Product),
        RepositoryMockService.getProvider(Attribute),
        RepositoryMockService.getProvider(AttributeType),
        DtoGeneratorService,
        {
          provide: LocalFilesService,
          useValue: {
            createPhotoThumbnail: jest.fn((v: string) => v + '-thumbnail'),
          },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    generate = module
      .get<DtoGeneratorService>(DtoGeneratorService)
      .generate.bind(module.get<DtoGeneratorService>(DtoGeneratorService));
    mockProductsRepository = module.get(getRepositoryToken(Product));
    mockAttributesTypesRepository = module.get(
      getRepositoryToken(AttributeType),
    );
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
        ratings: [],
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
        ratings: [],
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
        ratings: [],
        created: expect.any(Date),
        updated: expect.any(Date),
      });
      expect(
        mockProductsRepository.entities.some((p) => p.name === updateData.name),
      ).toBeTruthy();
    });

    it('should throw error if product not found', async () => {
      await expect(service.updateProduct(12345, {})).rejects.toThrow(
        NotFoundError,
      );
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

    it('should throw error if product not found', async () => {
      await expect(service.deleteProduct(12345)).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateProductAttributes', () => {
    it('should update product attributes', async () => {
      const product = generate(ProductCreateDto, true);
      const { id } = mockProductsRepository.save(product);
      const attributeTypeData = generate(AttributeTypeDto);
      attributeTypeData.valueType = AttributeValueType.String;
      const { id: attrId } =
        mockAttributesTypesRepository.save(attributeTypeData);
      let attributesData = generate(AttributeDto, false, 4);
      attributesData = attributesData.map((a) => ({ ...a, typeId: attrId }));
      const updated = await service.updateProductAttributes(id, attributesData);
      const expectedAttributes = attributesData.map((a) => ({
        id: expect.any(Number),
        value: a.value,
        type: {
          id: a.typeId,
          name: expect.any(String),
          valueType: expect.any(String),
          attributes: [],
        },
        product: null,
      }));
      expect(updated).toEqual({
        ...product,
        id,
        attributes: expectedAttributes,
        photos: [],
        ratings: [],
        created: expect.any(Date),
        updated: expect.any(Date),
      });
      expect(
        mockProductsRepository.entities.find((p) => p.id === id)?.attributes,
      ).toEqual(expectedAttributes);
    });

    it('should throw error if product not found', async () => {
      await expect(service.updateProductAttributes(12345, [])).rejects.toThrow(
        NotFoundError,
      );
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
          thumbnailPath: fileMetadata.path + '-thumbnail',
        },
      ]);
    });

    it('should throw error if product not found', async () => {
      const fileMetadata = generateFileMetadata();
      await expect(
        service.addProductPhoto(12345, fileMetadata),
      ).rejects.toThrow(NotFoundError);
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

    it('should throw error if product not found', async () => {
      await expect(service.deleteProductPhoto(12345, 12345)).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
