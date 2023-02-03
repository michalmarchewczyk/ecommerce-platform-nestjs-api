import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from './models/product.entity';
import { Attribute } from './models/attribute.entity';
import { DtoGeneratorService } from '../../../test/utils/dto-generator/dto-generator.service';
import { ProductCreateDto } from './dto/product-create.dto';
import { ProductUpdateDto } from './dto/product-update.dto';
import { AttributeDto } from './dto/attribute.dto';
import { RepositoryMockService } from '../../../test/utils/repository-mock/repository-mock.service';
import { NotFoundError } from '../../errors/not-found.error';
import { AttributeType } from '../attribute-types/models/attribute-type.entity';
import { AttributeTypeDto } from '../attribute-types/dto/attribute-type.dto';
import { AttributeValueType } from '../attribute-types/models/attribute-value-type.enum';
import { AttributeTypesService } from '../attribute-types/attribute-types.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let generate: DtoGeneratorService['generate'];
  let mockProductsRepository: RepositoryMockService<Product>;
  let mockAttributeTypesRepository: RepositoryMockService<AttributeType>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        AttributeTypesService,
        RepositoryMockService.getProvider(Product),
        RepositoryMockService.getProvider(Attribute),
        RepositoryMockService.getProvider(AttributeType),
        DtoGeneratorService,
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    generate = module
      .get<DtoGeneratorService>(DtoGeneratorService)
      .generate.bind(module.get<DtoGeneratorService>(DtoGeneratorService));
    mockProductsRepository = module.get(getRepositoryToken(Product));
    mockAttributeTypesRepository = module.get(
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
        photosOrder: '',
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
        photosOrder: '',
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
      updateData.photosOrder = '';
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
        mockAttributeTypesRepository.save(attributeTypeData);
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
        photosOrder: '',
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
});
