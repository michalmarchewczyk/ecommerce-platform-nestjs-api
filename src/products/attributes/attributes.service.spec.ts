import { Test, TestingModule } from '@nestjs/testing';
import { AttributesService } from './attributes.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AttributeType } from '../entities/attribute-type.entity';
import { DtoGeneratorService } from '../../../test/utils/dto-generator/dto-generator.service';
import { AttributeTypeDto } from '../dto/attribute-type.dto';
import { RepositoryMockService } from '../../../test/utils/repository-mock/repository-mock.service';

describe('AttributesService', () => {
  let service: AttributesService;
  let generate: DtoGeneratorService['generate'];
  let mockAttributeTypesRepository: RepositoryMockService<AttributeType>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttributesService,
        {
          provide: getRepositoryToken(AttributeType),
          useValue: new RepositoryMockService(AttributeType),
        },
        DtoGeneratorService,
      ],
    }).compile();

    service = module.get<AttributesService>(AttributesService);
    generate = module
      .get<DtoGeneratorService>(DtoGeneratorService)
      .generate.bind(module.get<DtoGeneratorService>(DtoGeneratorService));
    mockAttributeTypesRepository = module.get(
      getRepositoryToken(AttributeType),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAttributeTypes', () => {
    it('should return all attribute types', async () => {
      expect(await service.getAttributeTypes()).toEqual(
        mockAttributeTypesRepository.entities,
      );
    });
  });

  describe('createAttributeType', () => {
    it('should create an attribute type', async () => {
      const attributeType = generate(AttributeTypeDto);
      const created = await service.createAttributeType(attributeType);
      expect(created).toEqual({
        ...attributeType,
        id: expect.any(Number),
        attributes: [],
      });
    });
  });

  describe('updateAttributeType', () => {
    it('should update an attribute type', async () => {
      const createData = generate(AttributeTypeDto);
      const { id } = await service.createAttributeType(createData);
      const updateData = generate(AttributeTypeDto);
      const updated = await service.updateAttributeType(id, updateData);
      expect(updated).toBeDefined();
      expect(
        mockAttributeTypesRepository.entities.find((a) => a.id === id),
      ).toEqual({
        id: expect.any(Number),
        ...updateData,
        attributes: [],
      });
    });

    it('should return null if attribute type does not exist', async () => {
      const updateData = generate(AttributeTypeDto);
      const updated = await service.updateAttributeType(12345, updateData);
      expect(updated).toBeNull();
    });
  });

  describe('deleteAttributeType', () => {
    it('should delete an attribute type', async () => {
      const createData = generate(AttributeTypeDto);
      const { id } = await service.createAttributeType(createData);
      const deleted = await service.deleteAttributeType(id);
      expect(deleted).toBe(true);
      expect(
        mockAttributeTypesRepository.entities.find((a) => a.id === id),
      ).toBeUndefined();
    });

    it('should return false if attribute type does not exist', async () => {
      const deleted = await service.deleteAttributeType(12345);
      expect(deleted).toBe(false);
    });
  });
});
