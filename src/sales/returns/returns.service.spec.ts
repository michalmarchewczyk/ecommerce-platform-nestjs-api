import { Test, TestingModule } from '@nestjs/testing';
import { ReturnsService } from './returns.service';
import { RepositoryMockService } from '../../../test/utils/repository-mock/repository-mock.service';
import { Return } from './entities/return.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DtoGeneratorService } from '../../../test/utils/dto-generator/dto-generator.service';
import { ReturnCreateDto } from './dto/return-create.dto';
import { Order } from '../entities/order.entity';
import { OrderCreateDto } from '../dto/order-create.dto';
import { User } from '../../users/entities/user.entity';
import { NotFoundError } from '../../errors/not-found.error';

describe('ReturnsService', () => {
  let service: ReturnsService;
  let mockReturnsRepository: RepositoryMockService<Return>;
  let mockOrdersRepository: RepositoryMockService<Order>;
  let generate: DtoGeneratorService['generate'];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReturnsService,
        RepositoryMockService.getProvider(Return),
        RepositoryMockService.getProvider(Order),
        DtoGeneratorService,
      ],
    }).compile();

    service = module.get<ReturnsService>(ReturnsService);
    mockReturnsRepository = module.get(getRepositoryToken(Return));
    mockOrdersRepository = module.get(getRepositoryToken(Order));
    generate = module
      .get(DtoGeneratorService)
      .generate.bind(module.get(DtoGeneratorService));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getReturns', () => {
    it('should return an array of returns', async () => {
      const returns = await service.getReturns();
      expect(returns).toEqual(mockReturnsRepository.find());
    });
  });

  describe('getReturn', () => {
    it('should return a return by id', async () => {
      const createData = generate(ReturnCreateDto);
      const { id } = await mockReturnsRepository.save(createData);
      const returnFound = await service.getReturn(id);
      expect(returnFound).toMatchObject({
        message: createData.message,
        id,
        status: 'open',
      });
    });

    it('should throw error if return not found', async () => {
      await expect(service.getReturn(12345)).rejects.toThrow(NotFoundError);
    });
  });

  describe('checkReturnUser', () => {
    it('should return true if user is order owner', async () => {
      const orderData = generate(OrderCreateDto);
      const order = mockOrdersRepository.save({
        ...orderData,
        user: { id: 123 },
      });
      const createData = generate(ReturnCreateDto);
      const { id } = mockReturnsRepository.save({ ...createData, order });
      const returnFound = await service.checkReturnUser(123, id);
      expect(returnFound).toBeTruthy();
    });

    it('should return false if user is not order owner', async () => {
      const orderData = generate(OrderCreateDto);
      const order = await mockOrdersRepository.save(orderData);
      const createData = generate(ReturnCreateDto);
      createData.orderId = order.id;
      order.user = { id: 123 } as User;
      const { id } = await mockReturnsRepository.save(createData);
      const returnFound = await service.checkReturnUser(12345, id);
      expect(returnFound).toBeFalsy();
    });

    it('should return false if order has no user', async () => {
      const orderData = generate(OrderCreateDto);
      const order = await mockOrdersRepository.save(orderData);
      const createData = generate(ReturnCreateDto);
      createData.orderId = order.id;
      const { id } = await mockReturnsRepository.save(createData);
      const returnFound = await service.checkReturnUser(12345, id);
      expect(returnFound).toBeFalsy();
    });
  });

  describe('createReturn', () => {
    it('should create a return', async () => {
      const orderData = generate(OrderCreateDto);
      const order = await mockOrdersRepository.save(orderData);
      const createData = generate(ReturnCreateDto);
      createData.orderId = order.id;
      const created = await service.createReturn(createData);
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
      const updated = await service.updateReturn(created.id, updateData);
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
      await expect(service.updateReturn(12345, {})).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
