import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { RepositoryMockService } from '../../../test/utils/repository-mock/repository-mock.service';
import { DtoGeneratorService } from '../../../test/utils/dto-generator/dto-generator.service';
import { PaymentMethod } from '../entities/payment-method.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentMethodDto } from '../dto/payment-method.dto';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let mockPaymentsRepository: RepositoryMockService<PaymentMethod>;
  let generate: DtoGeneratorService['generate'];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        RepositoryMockService.getProvider(PaymentMethod),
        DtoGeneratorService,
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    mockPaymentsRepository = module.get(getRepositoryToken(PaymentMethod));
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
      expect(methods).toEqual(mockPaymentsRepository.find());
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

    it('should return null if no payment method found', async () => {
      const updateData = generate(PaymentMethodDto);
      const updated = await service.updateMethod(12345, updateData);
      expect(updated).toBeNull();
    });
  });

  describe('deleteMethod', () => {
    it('should delete a payment method', async () => {
      const createData = generate(PaymentMethodDto);
      const { id } = await service.createMethod(createData);
      const deleted = await service.deleteMethod(id);
      expect(deleted).toBe(true);
      expect(
        mockPaymentsRepository.entities.find((m) => m.id === id),
      ).toBeUndefined();
    });

    it('should return false if no payment method found', async () => {
      const deleted = await service.deleteMethod(12345);
      expect(deleted).toBe(false);
    });
  });
});
