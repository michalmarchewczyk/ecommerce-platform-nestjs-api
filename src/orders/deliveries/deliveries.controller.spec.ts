import { Test, TestingModule } from '@nestjs/testing';
import { DeliveriesController } from './deliveries.controller';
import { DeliveriesService } from './deliveries.service';
import { RepositoryMockService } from '../../../test/utils/repository-mock/repository-mock.service';
import { DeliveryMethod } from '../entities/delivery-method.entity';
import { DtoGeneratorService } from '../../../test/utils/dto-generator/dto-generator.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DeliveryMethodDto } from '../dto/delivery-method.dto';
import { NotFoundError } from '../../errors/not-found.error';

describe('DeliveriesController', () => {
  let controller: DeliveriesController;
  let mockDeliveriesRepository: RepositoryMockService<DeliveryMethod>;
  let generate: DtoGeneratorService['generate'];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeliveriesController],
      providers: [
        DeliveriesService,
        RepositoryMockService.getProvider(DeliveryMethod),
        DtoGeneratorService,
      ],
    }).compile();

    controller = module.get<DeliveriesController>(DeliveriesController);
    mockDeliveriesRepository = module.get(getRepositoryToken(DeliveryMethod));
    generate = module
      .get(DtoGeneratorService)
      .generate.bind(module.get(DtoGeneratorService));
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMethods', () => {
    it('should return all delivery methods', async () => {
      const methods = await controller.getMethods();
      expect(methods).toEqual(mockDeliveriesRepository.find());
    });
  });

  describe('createMethod', () => {
    it('should create a new delivery method', async () => {
      const createData = generate(DeliveryMethodDto);
      const created = await controller.createMethod(createData);
      expect(created).toMatchObject(createData);
    });
  });

  describe('updateMethod', () => {
    it('should update a delivery method', async () => {
      const createData = generate(DeliveryMethodDto);
      const { id } = await controller.createMethod(createData);
      const updateData = generate(DeliveryMethodDto);
      const updated = await controller.updateMethod(id, updateData);
      expect(updated).toMatchObject(updateData);
    });

    it('should throw error if no delivery method found', async () => {
      const updateData = generate(DeliveryMethodDto);
      await expect(controller.updateMethod(12345, updateData)).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe('deleteMethod', () => {
    it('should delete a delivery method', async () => {
      const createData = generate(DeliveryMethodDto);
      const { id } = await controller.createMethod(createData);
      await controller.deleteMethod(id);
      expect(
        mockDeliveriesRepository.entities.find((m) => m.id === id),
      ).toBeUndefined();
    });

    it('should throw error if no delivery method found', async () => {
      await expect(controller.deleteMethod(12345)).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
