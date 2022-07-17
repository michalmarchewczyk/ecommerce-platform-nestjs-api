import { Test, TestingModule } from '@nestjs/testing';
import { AttributesController } from './attributes.controller';
import { AttributesService } from './attributes.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AttributeType } from '../entities/attribute-type.entity';
import { NotFoundException } from '@nestjs/common';
import { DtoGeneratorService } from '../../../test/utils/dto-generator/dto-generator.service';
import { AttributeTypeDto } from '../dto/attribute-type.dto';
import { RepositoryMockService } from '../../../test/utils/repository-mock/repository-mock.service';

describe('AttributesController', () => {
  let controller: AttributesController;
  let generate: DtoGeneratorService['generate'];
  let mockAttributeTypesRepository: RepositoryMockService<AttributeType>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttributesController],
      providers: [
        AttributesService,
        {
          provide: getRepositoryToken(AttributeType),
          useValue: new RepositoryMockService(AttributeType),
        },
        DtoGeneratorService,
      ],
    }).compile();

    controller = module.get<AttributesController>(AttributesController);
    generate = module
      .get<DtoGeneratorService>(DtoGeneratorService)
      .generate.bind(module.get<DtoGeneratorService>(DtoGeneratorService));
    mockAttributeTypesRepository = module.get(
      getRepositoryToken(AttributeType),
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAttributeTypes', () => {
    it('should return all attribute types', async () => {
      expect(await controller.getAttributeTypes()).toEqual(
        mockAttributeTypesRepository.entities,
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
        attributes: [],
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
        mockAttributeTypesRepository.entities.find((a) => a.id === id),
      ).toEqual({
        id: expect.any(Number),
        ...updateData,
        attributes: [],
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
        mockAttributeTypesRepository.entities.find((a) => a.id === id),
      ).toBeUndefined();
    });

    it('should throw error if attribute type does not exist', async () => {
      await expect(controller.deleteAttributeType(12345)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
