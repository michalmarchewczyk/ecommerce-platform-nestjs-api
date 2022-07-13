import { Test, TestingModule } from '@nestjs/testing';
import { AttributesService } from './attributes.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  AttributeType,
  AttributeValueType,
} from '../entities/attribute-type.entity';

describe('AttributesService', () => {
  let service: AttributesService;
  const mockAttributeTypesRepository = {
    attributeTypes: [],
    save(attributeType): AttributeType {
      const id = attributeType.id ?? Math.floor(Math.random() * 1000000);
      const valueType = attributeType.valueType ?? 'string';
      this.attributeTypes.push({ ...attributeType, id, valueType });
      return { ...attributeType, id, valueType } as AttributeType;
    },
    find(): AttributeType[] {
      return this.attributeTypes;
    },
    findOne(options: { where: { id?: number } }): AttributeType | null {
      const attributeType = this.attributeTypes.find(
        (p) => p.id === options.where.id,
      );
      return attributeType ?? null;
    },
    delete(where: { id: number }): void {
      this.attributeTypes = this.attributeTypes.filter(
        (p) => p.id !== where.id,
      );
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttributesService,
        {
          provide: getRepositoryToken(AttributeType),
          useValue: mockAttributeTypesRepository,
        },
      ],
    }).compile();

    service = module.get<AttributesService>(AttributesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAttributeTypes', () => {
    it('should return all attribute types', async () => {
      expect(await service.getAttributeTypes()).toEqual(
        mockAttributeTypesRepository.attributeTypes,
      );
    });
  });

  describe('createAttributeType', () => {
    it('should create an attribute type', async () => {
      const attributeType = await service.createAttributeType({
        name: 'test',
        valueType: AttributeValueType.String,
      });
      expect(attributeType).toEqual({
        name: 'test',
        valueType: 'string',
        id: expect.any(Number),
      });
    });
  });

  describe('updateAttributeType', () => {
    it('should update an attribute type', async () => {
      const { id } = await service.createAttributeType({
        name: 'test',
        valueType: AttributeValueType.String,
      });
      const attributeType = await service.updateAttributeType(id, {
        name: 'test2',
        valueType: AttributeValueType.Number,
      });
      expect(attributeType).toBeDefined();
      expect(
        mockAttributeTypesRepository.attributeTypes.find((a) => a.id === id),
      ).toEqual({
        id: expect.any(Number),
        name: 'test2',
        valueType: AttributeValueType.Number,
      });
    });

    it('should return null if attribute type does not exist', async () => {
      const attributeType = await service.updateAttributeType(12345, {
        name: 'test2',
        valueType: AttributeValueType.Number,
      });
      expect(attributeType).toBeNull();
    });
  });

  describe('deleteAttributeType', () => {
    it('should delete an attribute type', async () => {
      const { id } = await service.createAttributeType({
        name: 'test',
        valueType: AttributeValueType.String,
      });
      await service.deleteAttributeType(id);
      expect(
        mockAttributeTypesRepository.attributeTypes.find((a) => a.id === id),
      ).toBeUndefined();
    });

    it('should return false if attribute type does not exist', async () => {
      const attributeType = await service.deleteAttributeType(12345);
      expect(attributeType).toBeFalsy();
    });
  });
});
