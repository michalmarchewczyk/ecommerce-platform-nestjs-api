import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentMethod } from '../entities/payment-method.entity';
import { RepositoryMockService } from '../../../test/utils/repository-mock/repository-mock.service';
import { DtoGeneratorService } from '../../../test/utils/dto-generator/dto-generator.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentMethodDto } from '../dto/payment-method.dto';
import { NotFoundError } from '../../errors/not-found.error';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let mockPaymentsRepository: RepositoryMockService<PaymentMethod>;
  let generate: DtoGeneratorService['generate'];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        PaymentsService,
        RepositoryMockService.getProvider(PaymentMethod),
        DtoGeneratorService,
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
    mockPaymentsRepository = module.get(getRepositoryToken(PaymentMethod));
    generate = module
      .get(DtoGeneratorService)
      .generate.bind(module.get(DtoGeneratorService));
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMethods', () => {
    it('should return all payment methods', async () => {
      const methods = await controller.getMethods();
      expect(methods).toEqual(mockPaymentsRepository.find());
    });
  });

  describe('createMethod', () => {
    it('should create a new payment method', async () => {
      const createData = generate(PaymentMethodDto);
      const created = await controller.createMethod(createData);
      expect(created).toMatchObject(createData);
    });
  });

  describe('updateMethod', () => {
    it('should update a payment method', async () => {
      const createData = generate(PaymentMethodDto);
      const { id } = await controller.createMethod(createData);
      const updateData = generate(PaymentMethodDto);
      const updated = await controller.updateMethod(id, updateData);
      expect(updated).toMatchObject(updateData);
    });

    it('should throw error if no payment method found', async () => {
      const updateData = generate(PaymentMethodDto);
      await expect(controller.updateMethod(12345, updateData)).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe('deleteMethod', () => {
    it('should delete a payment method', async () => {
      const createData = generate(PaymentMethodDto);
      const { id } = await controller.createMethod(createData);
      await controller.deleteMethod(id);
      expect(
        mockPaymentsRepository.entities.find((m) => m.id === id),
      ).toBeUndefined();
    });

    it('should throw error if no payment method found', async () => {
      await expect(controller.deleteMethod(12345)).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
