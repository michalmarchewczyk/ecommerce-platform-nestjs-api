import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { UsersService } from '../users/users.service';
import { ProductsService } from '../products/products.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { RepositoryMockService } from '../../test/utils/repository-mock/repository-mock.service';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { Attribute } from '../products/entities/attribute.entity';
import { DtoGeneratorService } from '../../test/utils/dto-generator/dto-generator.service';
import { OrderCreateDto } from './dto/order-create.dto';
import { RegisterDto } from '../auth/dto/register.dto';
import { OrderUpdateDto } from './dto/order-update.dto';
import { OrderItemDto } from './dto/order-item.dto';
import { ProductCreateDto } from '../products/dto/product-create.dto';

describe('OrdersService', () => {
  let service: OrdersService;
  let mockOrdersRepository: RepositoryMockService<Order>;
  let mockUsersRepository: RepositoryMockService<User>;
  let mockProductsRepository: RepositoryMockService<Product>;
  let generate: DtoGeneratorService['generate'];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        UsersService,
        ProductsService,
        RepositoryMockService.getProvider(Order),
        RepositoryMockService.getProvider(User),
        RepositoryMockService.getProvider(Product),
        RepositoryMockService.getProvider(Attribute),
        DtoGeneratorService,
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    mockOrdersRepository = module.get(getRepositoryToken(Order));
    mockUsersRepository = module.get(getRepositoryToken(User));
    mockProductsRepository = module.get(getRepositoryToken(Product));
    generate = module
      .get(DtoGeneratorService)
      .generate.bind(module.get(DtoGeneratorService));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOrders', () => {
    it('should return an array of orders', async () => {
      const ordersData = generate(OrderCreateDto, false, 4);
      mockOrdersRepository.save(ordersData);
      const orders = await service.getOrders();
      expect(orders).toEqual(mockOrdersRepository.entities);
    });
  });

  describe('getOrder', () => {
    it('should return an order with given id', async () => {
      const createData = generate(OrderCreateDto, false);
      const { id } = mockOrdersRepository.save(createData);
      const order = await service.getOrder(id);
      expect(order).toEqual(
        mockOrdersRepository.entities.find((o) => o.id === id),
      );
    });

    it('should return null if order with given id does not exist', async () => {
      const order = await service.getOrder(12345);
      expect(order).toBeNull();
    });
  });

  describe('checkOrderUser', () => {
    it('should return true if order with given id belongs to user with given id', async () => {
      const userData = generate(RegisterDto, false);
      const { id: userId } = await mockUsersRepository.save(userData);
      const createData = generate(OrderCreateDto, false);
      createData.items = [generate(OrderItemDto, false)];
      const { id: productId } = await mockProductsRepository.save(
        generate(ProductCreateDto, false),
      );
      createData.items[0].productId = productId;
      const { id } = await service.createOrder(userId, createData);
      const order = await service.checkOrderUser(userId, id);
      expect(order).toBeTruthy();
    });

    it('should return false if order with given id does not belong to user with given id', async () => {
      const createData = generate(OrderCreateDto, false);
      createData.items = [generate(OrderItemDto, false)];
      const { id: productId } = await mockProductsRepository.save(
        generate(ProductCreateDto, false),
      );
      createData.items[0].productId = productId;
      const { id } = await mockOrdersRepository.save(createData);
      const order = await service.checkOrderUser(12345, id);
      expect(order).toBeFalsy();
    });
  });

  describe('createOrder', () => {
    it('should create an order', async () => {
      const createData = generate(OrderCreateDto, false);
      createData.items = [generate(OrderItemDto, false)];
      const { id: productId } = await mockProductsRepository.save(
        generate(ProductCreateDto, false),
      );
      createData.items[0].productId = productId;
      const order = await service.createOrder(12345, createData);
      expect(order).toEqual(
        mockOrdersRepository.entities.find((o) => o.id === order.id),
      );
      const { items, ...expected } = createData;
      expect(order).toMatchObject(expected);
    });
  });

  describe('updateOrder', () => {
    it('should update an order', async () => {
      const createData = generate(OrderCreateDto, false);
      const { id } = await mockOrdersRepository.save(createData);
      const updateData = generate(OrderUpdateDto, true);
      const order = await service.updateOrder(id, updateData);
      expect(order).toEqual(
        mockOrdersRepository.entities.find((o) => o.id === id),
      );
      const { items, ...expected } = updateData;
      expect(order).toMatchObject(expected);
    });

    it('should return null if order with given id does not exist', async () => {
      const updateData = generate(OrderUpdateDto, true);
      const order = await service.updateOrder(12345, updateData);
      expect(order).toBeNull();
    });
  });
});
