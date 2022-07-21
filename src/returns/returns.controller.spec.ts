import { Test, TestingModule } from '@nestjs/testing';
import { ReturnsController } from './returns.controller';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Return } from './entities/return.entity';
import { DtoGeneratorService } from '../../test/utils/dto-generator/dto-generator.service';
import { RepositoryMockService } from '../../test/utils/repository-mock/repository-mock.service';
import { ReturnsService } from './returns.service';
import { Order } from '../orders/entities/order.entity';
import { ReturnCreateDto } from './dto/return-create.dto';
import { OrderCreateDto } from '../orders/dto/order-create.dto';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/entities/role.enum';
import { NotFoundException } from '@nestjs/common';

describe('ReturnsController', () => {
  let controller: ReturnsController;
  let mockReturnsRepository: RepositoryMockService<Return>;
  let mockOrdersRepository: RepositoryMockService<Order>;
  let generate: DtoGeneratorService['generate'];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReturnsController],
      providers: [
        ReturnsService,
        RepositoryMockService.getProvider(Return),
        RepositoryMockService.getProvider(Order),
        DtoGeneratorService,
      ],
    }).compile();

    controller = module.get<ReturnsController>(ReturnsController);
    mockReturnsRepository = module.get(getRepositoryToken(Return));
    mockOrdersRepository = module.get(getRepositoryToken(Order));
    generate = module
      .get(DtoGeneratorService)
      .generate.bind(module.get(DtoGeneratorService));
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getReturns', () => {
    it('should return an array of returns', async () => {
      const returns = await controller.getReturns();
      expect(returns).toEqual(mockReturnsRepository.find());
    });
  });

  describe('getReturn', () => {
    it('should return a return by id', async () => {
      const createData = generate(ReturnCreateDto);
      const { id } = await mockReturnsRepository.save(createData);
      const returnFound = await controller.getReturn({} as User, id);
      expect(returnFound).toMatchObject({
        message: createData.message,
        id,
        status: 'open',
      });
    });

    it('should throw error if return not found', async () => {
      await expect(controller.getReturn({} as User, 12345)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createReturn', () => {
    it('should create a return', async () => {
      const orderData = generate(OrderCreateDto);
      const order = await mockOrdersRepository.save(orderData);
      const createData = generate(ReturnCreateDto);
      createData.orderId = order.id;
      const created = await controller.createReturn(
        { role: Role.Admin } as User,
        createData,
      );
      expect(created).toEqual({
        message: createData.message,
        id: expect.any(Number),
        status: 'open',
        order,
        created: expect.any(Date),
        updated: expect.any(Date),
      });
    });
  });

  describe('updateReturn', () => {
    it('should update a return', async () => {
      const createData = generate(ReturnCreateDto);
      const created = await mockReturnsRepository.save(createData);
      const updateData = generate(ReturnCreateDto, true);
      const updated = await controller.updateReturn(created.id, updateData);
      expect(updated).toEqual({
        ...updateData,
        id: created.id,
        status: 'open',
        order: expect.any(Object),
        created: expect.any(Date),
        updated: expect.any(Date),
      });
    });

    it('should throw error if return not found', async () => {
      await expect(controller.updateReturn(12345, {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
