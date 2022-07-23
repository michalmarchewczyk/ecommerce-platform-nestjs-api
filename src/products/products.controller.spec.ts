import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
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

describe('ProductsController', () => {
  let controller: ProductsController;
  let generate: DtoGeneratorService['generate'];
  let mockProductsRepository: RepositoryMockService<Product>;
  let mockAttributesTypesRepository: RepositoryMockService<AttributeType>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        ProductsService,
        RepositoryMockService.getProvider(Product),
        RepositoryMockService.getProvider(Attribute),
        RepositoryMockService.getProvider(AttributeType),
        DtoGeneratorService,
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    generate = module
      .get<DtoGeneratorService>(DtoGeneratorService)
      .generate.bind(module.get<DtoGeneratorService>(DtoGeneratorService));
    mockProductsRepository = module.get(getRepositoryToken(Product));
    mockAttributesTypesRepository = module.get(
      getRepositoryToken(AttributeType),
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProducts', () => {
    it('should return all products', async () => {
      expect(await controller.getProducts()).toEqual(
        mockProductsRepository.entities,
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
      mockProductsRepository.save(product);
      expect(await controller.getProduct(1)).toEqual({
        ...product,
        photos: [],
        created: expect.any(Date),
        updated: expect.any(Date),
      });
    });

    it('should throw error if product not found', async () => {
      await expect(controller.getProduct(12345)).rejects.toThrow(NotFoundError);
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
        created: expect.any(Date),
        updated: expect.any(Date),
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
        created: expect.any(Date),
        updated: expect.any(Date),
      });
    });

    it('should throw error when product not found', async () => {
      await expect(controller.updateProduct(12345, {})).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product', async () => {
      const createData = generate(ProductCreateDto);
      const { id } = await controller.createProduct(createData);
      await controller.deleteProduct(id);
      expect(
        mockProductsRepository.entities.find((p) => p.id === id),
      ).toBeUndefined();
    });

    it('should throw error when product not found', async () => {
      await expect(controller.deleteProduct(12345)).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe('updateProductAttributes', () => {
    it('should update a product attributes', async () => {
      const createData = generate(ProductCreateDto, true);
      const { id } = await controller.createProduct(createData);
      const attributeTypeData = generate(AttributeTypeDto);
      attributeTypeData.valueType = AttributeValueType.String;
      const { id: attrId } =
        mockAttributesTypesRepository.save(attributeTypeData);
      let attributesData = generate(AttributeDto, false, 4);
      attributesData = attributesData.map((a) => ({ ...a, typeId: attrId }));
      const updated = await controller.updateProductAttributes(
        id,
        attributesData,
      );
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
        ...createData,
        id: expect.any(Number),
        photos: [],
        attributes: expectedAttributes,
        created: expect.any(Date),
        updated: expect.any(Date),
      });
    });

    it('should throw error when product not found', async () => {
      await expect(
        controller.updateProductAttributes(12345, []),
      ).rejects.toThrow(NotFoundError);
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
        mockProductsRepository.entities.find((p) => p.id === id)?.photos,
      ).toEqual([
        {
          path: fileMetadata.path,
          mimeType: 'image/jpeg',
        },
      ]);
    });

    it('should throw error when product not found', async () => {
      await expect(controller.addProductPhoto(12345, null)).rejects.toThrow(
        NotFoundError,
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
        mockProductsRepository.entities.find((p) => p.id === id)?.photos,
      ).toEqual([]);
    });

    it('should throw error when product not found', async () => {
      await expect(controller.deleteProductPhoto(12345, 12345)).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
