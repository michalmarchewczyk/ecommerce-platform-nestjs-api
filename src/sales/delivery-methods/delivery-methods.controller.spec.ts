import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryMethodsController } from './delivery-methods.controller';
import { DeliveryMethodsService } from './delivery-methods.service';
import { RepositoryMockService } from '../../../test/utils/repository-mock/repository-mock.service';
import { DeliveryMethod } from './models/delivery-method.entity';
import { DtoGeneratorService } from '../../../test/utils/dto-generator/dto-generator.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DeliveryMethodDto } from './dto/delivery-method.dto';
import { NotFoundError } from '../../errors/not-found.error';

describe('DeliveryMethodsController', () => {
  let controller: DeliveryMethodsController;
  let mockDeliveryMethodsRepository: RepositoryMockService<DeliveryMethod>;
  let generate: DtoGeneratorService['generate'];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeliveryMethodsController],
      providers: [
        DeliveryMethodsService,
        RepositoryMockService.getProvider(DeliveryMethod),
        DtoGeneratorService,
      ],
    }).compile();

    controller = module.get<DeliveryMethodsController>(
      DeliveryMethodsController,
    );
    mockDeliveryMethodsRepository = module.get(
      getRepositoryToken(DeliveryMethod),
    );
    generate = module
      .get(DtoGeneratorService)
      .generate.bind(module.get(DtoGeneratorService));
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMethods', () => {
    it('should return all delivery methods', async () => {
      const methods = await controller.getDeliveryMethods();
      expect(methods).toEqual(mockDeliveryMethodsRepository.find());
    });
  });

  describe('createMethod', () => {
    it('should create a new delivery method', async () => {
      const createData = generate(DeliveryMethodDto);
      const created = await controller.createDeliveryMethod(createData);
      expect(created).toMatchObject(createData);
    });
  });

  describe('updateMethod', () => {
    it('should update a delivery method', async () => {
      const createData = generate(DeliveryMethodDto);
      const { id } = await controller.createDeliveryMethod(createData);
      const updateData = generate(DeliveryMethodDto);
      const updated = await controller.updateDeliveryMethod(id, updateData);
      expect(updated).toMatchObject(updateData);
    });

    it('should throw error if no delivery method found', async () => {
      const updateData = generate(DeliveryMethodDto);
      await expect(
        controller.updateDeliveryMethod(12345, updateData),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteMethod', () => {
    it('should delete a delivery method', async () => {
      const createData = generate(DeliveryMethodDto);
      const { id } = await controller.createDeliveryMethod(createData);
      await controller.deleteDeliveryMethod(id);
      expect(
        mockDeliveryMethodsRepository.entities.find((m) => m.id === id),
      ).toBeUndefined();
    });

    it('should throw error if no delivery method found', async () => {
      await expect(controller.deleteDeliveryMethod(12345)).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
