import { Test, TestingModule } from '@nestjs/testing';
import { PaymentMethodsController } from './payment-methods.controller';
import { PaymentMethod } from './models/payment-method.entity';
import { RepositoryMockService } from '../../../test/utils/repository-mock/repository-mock.service';
import { DtoGeneratorService } from '../../../test/utils/dto-generator/dto-generator.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentMethodsService } from './payment-methods.service';
import { PaymentMethodDto } from './dto/payment-method.dto';
import { NotFoundError } from '../../errors/not-found.error';

describe('PaymentMethodsController', () => {
  let controller: PaymentMethodsController;
  let mockPaymentMethodsRepository: RepositoryMockService<PaymentMethod>;
  let generate: DtoGeneratorService['generate'];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentMethodsController],
      providers: [
        PaymentMethodsService,
        RepositoryMockService.getProvider(PaymentMethod),
        DtoGeneratorService,
      ],
    }).compile();

    controller = module.get<PaymentMethodsController>(PaymentMethodsController);
    mockPaymentMethodsRepository = module.get(
      getRepositoryToken(PaymentMethod),
    );
    generate = module
      .get(DtoGeneratorService)
      .generate.bind(module.get(DtoGeneratorService));
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMethods', () => {
    it('should return all payment methods', async () => {
      const methods = await controller.getPaymentMethods();
      expect(methods).toEqual(mockPaymentMethodsRepository.find());
    });
  });

  describe('createMethod', () => {
    it('should create a new payment method', async () => {
      const createData = generate(PaymentMethodDto);
      const created = await controller.createPaymentMethod(createData);
      expect(created).toMatchObject(createData);
    });
  });

  describe('updateMethod', () => {
    it('should update a payment method', async () => {
      const createData = generate(PaymentMethodDto);
      const { id } = await controller.createPaymentMethod(createData);
      const updateData = generate(PaymentMethodDto);
      const updated = await controller.updatePaymentMethod(id, updateData);
      expect(updated).toMatchObject(updateData);
    });

    it('should throw error if no payment method found', async () => {
      const updateData = generate(PaymentMethodDto);
      await expect(
        controller.updatePaymentMethod(12345, updateData),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteMethod', () => {
    it('should delete a payment method', async () => {
      const createData = generate(PaymentMethodDto);
      const { id } = await controller.createPaymentMethod(createData);
      await controller.deletePaymentMethod(id);
      expect(
        mockPaymentMethodsRepository.entities.find((m) => m.id === id),
      ).toBeUndefined();
    });

    it('should throw error if no payment method found', async () => {
      await expect(controller.deletePaymentMethod(12345)).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
