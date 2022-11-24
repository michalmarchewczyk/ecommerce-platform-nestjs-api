import { Test, TestingModule } from '@nestjs/testing';
import { PaymentMethodsService } from './payment-methods.service';
import { RepositoryMockService } from '../../../test/utils/repository-mock/repository-mock.service';
import { DtoGeneratorService } from '../../../test/utils/dto-generator/dto-generator.service';
import { PaymentMethod } from './models/payment-method.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentMethodDto } from './dto/payment-method.dto';
import { NotFoundError } from '../../errors/not-found.error';

describe('PaymentMethodsService', () => {
  let service: PaymentMethodsService;
  let mockPaymentMethodsRepository: RepositoryMockService<PaymentMethod>;
  let generate: DtoGeneratorService['generate'];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentMethodsService,
        RepositoryMockService.getProvider(PaymentMethod),
        DtoGeneratorService,
      ],
    }).compile();

    service = module.get<PaymentMethodsService>(PaymentMethodsService);
    mockPaymentMethodsRepository = module.get(
      getRepositoryToken(PaymentMethod),
    );
    generate = module
      .get(DtoGeneratorService)
      .generate.bind(module.get(DtoGeneratorService));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMethods', () => {
    it('should return all payment methods', async () => {
      const methods = await service.getMethods();
      expect(methods).toEqual(mockPaymentMethodsRepository.find());
    });
  });

  describe('createMethod', () => {
    it('should create a new payment method', async () => {
      const createData = generate(PaymentMethodDto);
      const created = await service.createMethod(createData);
      expect(created).toMatchObject(createData);
    });
  });

  describe('updateMethod', () => {
    it('should update a payment method', async () => {
      const createData = generate(PaymentMethodDto);
      const { id } = await service.createMethod(createData);
      const updateData = generate(PaymentMethodDto);
      const updated = await service.updateMethod(id, updateData);
      expect(updated).toMatchObject(updateData);
    });

    it('should throw error if no payment method found', async () => {
      const updateData = generate(PaymentMethodDto);
      await expect(service.updateMethod(12345, updateData)).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe('deleteMethod', () => {
    it('should delete a payment method', async () => {
      const createData = generate(PaymentMethodDto);
      const { id } = await service.createMethod(createData);
      const deleted = await service.deleteMethod(id);
      expect(deleted).toBe(true);
      expect(
        mockPaymentMethodsRepository.entities.find((m) => m.id === id),
      ).toBeUndefined();
    });

    it('should throw error if no payment method found', async () => {
      await expect(service.deleteMethod(12345)).rejects.toThrow(NotFoundError);
    });
  });
});
