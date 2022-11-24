import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryMethodsService } from './delivery-methods.service';
import { RepositoryMockService } from '../../../test/utils/repository-mock/repository-mock.service';
import { DeliveryMethod } from './models/delivery-method.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DtoGeneratorService } from '../../../test/utils/dto-generator/dto-generator.service';
import { DeliveryMethodDto } from './dto/delivery-method.dto';
import { NotFoundError } from '../../errors/not-found.error';

describe('DeliveryMethodsService', () => {
  let service: DeliveryMethodsService;
  let mockDeliveryMethodsRepository: RepositoryMockService<DeliveryMethod>;
  let generate: DtoGeneratorService['generate'];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveryMethodsService,
        RepositoryMockService.getProvider(DeliveryMethod),
        DtoGeneratorService,
      ],
    }).compile();

    service = module.get<DeliveryMethodsService>(DeliveryMethodsService);
    mockDeliveryMethodsRepository = module.get(
      getRepositoryToken(DeliveryMethod),
    );
    generate = module
      .get(DtoGeneratorService)
      .generate.bind(module.get(DtoGeneratorService));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMethods', () => {
    it('should return all delivery methods', async () => {
      const methods = await service.getMethods();
      expect(methods).toEqual(mockDeliveryMethodsRepository.find());
    });
  });

  describe('createMethod', () => {
    it('should create a new delivery method', async () => {
      const createData = generate(DeliveryMethodDto);
      const created = await service.createMethod(createData);
      expect(created).toMatchObject(createData);
    });
  });

  describe('updateMethod', () => {
    it('should update a delivery method', async () => {
      const createData = generate(DeliveryMethodDto);
      const { id } = await service.createMethod(createData);
      const updateData = generate(DeliveryMethodDto);
      const updated = await service.updateMethod(id, updateData);
      expect(updated).toMatchObject(updateData);
    });

    it('should throw error if no delivery method found', async () => {
      const updateData = generate(DeliveryMethodDto);
      await expect(service.updateMethod(12345, updateData)).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe('deleteMethod', () => {
    it('should delete a delivery method', async () => {
      const createData = generate(DeliveryMethodDto);
      const { id } = await service.createMethod(createData);
      const deleted = await service.deleteMethod(id);
      expect(deleted).toBe(true);
      expect(
        mockDeliveryMethodsRepository.entities.find((m) => m.id === id),
      ).toBeUndefined();
    });

    it('should throw error if no delivery method found', async () => {
      await expect(service.deleteMethod(12345)).rejects.toThrow(NotFoundError);
    });
  });
});
