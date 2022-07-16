import { Test, TestingModule } from '@nestjs/testing';
import { AttributesController } from './attributes.controller';
import { AttributesService } from './attributes.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AttributeType } from '../entities/attribute-type.entity';
import { NotFoundException } from '@nestjs/common';
import { DtoGeneratorService } from '../../../test/utils/dto-generator/dto-generator.service';
import { AttributeTypeDto } from '../dto/attribute-type.dto';

describe('AttributesController', () => {
  let controller: AttributesController;
  let generate: DtoGeneratorService['generate'];
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
      controllers: [AttributesController],
      providers: [
        AttributesService,
        {
          provide: getRepositoryToken(AttributeType),
          useValue: mockAttributeTypesRepository,
        },
        DtoGeneratorService,
      ],
    }).compile();

    controller = module.get<AttributesController>(AttributesController);
    generate = module
      .get<DtoGeneratorService>(DtoGeneratorService)
      .generate.bind(module.get<DtoGeneratorService>(DtoGeneratorService));
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAttributeTypes', () => {
    it('should return all attribute types', async () => {
      expect(await controller.getAttributeTypes()).toEqual(
        mockAttributeTypesRepository.attributeTypes,
      );
    });
  });

  describe('createAttributeType', () => {
    it('should create an attribute type', async () => {
      const createData = generate(AttributeTypeDto);
      const created = await controller.createAttributeType(createData);
      expect(created).toEqual({
        id: expect.any(Number),
        ...createData,
      });
    });
  });

  describe('updateAttributeType', () => {
    it('should update an attribute type', async () => {
      const createData = generate(AttributeTypeDto);
      const { id } = await controller.createAttributeType(createData);
      const updateData = generate(AttributeTypeDto);
      const updated = await controller.updateAttributeType(id, updateData);
      expect(updated).toBeDefined();
      expect(
        mockAttributeTypesRepository.attributeTypes.find((a) => a.id === id),
      ).toEqual({
        id: expect.any(Number),
        ...updateData,
      });
    });

    it('should throw error if attribute type does not exist', async () => {
      const updateData = generate(AttributeTypeDto);
      await expect(
        controller.updateAttributeType(12345, updateData),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteAttributeType', () => {
    it('should delete an attribute type', async () => {
      const createData = generate(AttributeTypeDto);
      const { id } = await controller.createAttributeType(createData);
      await controller.deleteAttributeType(id);
      expect(
        mockAttributeTypesRepository.attributeTypes.find((a) => a.id === id),
      ).toBeUndefined();
    });

    it('should throw error if attribute type does not exist', async () => {
      await expect(controller.deleteAttributeType(12345)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
