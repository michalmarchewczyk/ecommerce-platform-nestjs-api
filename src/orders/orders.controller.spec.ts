import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { UsersService } from '../users/users.service';
import { ProductsService } from '../products/products.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RepositoryMockService } from '../../test/utils/repository-mock/repository-mock.service';
import { Order } from './entities/order.entity';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { Attribute } from '../products/entities/attribute.entity';
import { OrderCreateDto } from './dto/order-create.dto';
import { RegisterDto } from '../auth/dto/register.dto';
import { DtoGeneratorService } from '../../test/utils/dto-generator/dto-generator.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrderUpdateDto } from './dto/order-update.dto';
import { OrderItemDto } from './dto/order-item.dto';
import { ProductCreateDto } from '../products/dto/product-create.dto';

describe('OrdersController', () => {
  let controller: OrdersController;
  let mockOrdersRepository: RepositoryMockService<Order>;
  let mockUsersRepository: RepositoryMockService<User>;
  let mockProductsRepository: RepositoryMockService<Product>;
  let generate: DtoGeneratorService['generate'];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
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

    controller = module.get<OrdersController>(OrdersController);
    mockOrdersRepository = module.get(getRepositoryToken(Order));
    mockUsersRepository = module.get(getRepositoryToken(User));
    mockProductsRepository = module.get(getRepositoryToken(Product));
    generate = module
      .get(DtoGeneratorService)
      .generate.bind(module.get(DtoGeneratorService));
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getOrders', () => {
    it('should return an array of orders', async () => {
      const ordersData = generate(OrderCreateDto, false, 4);
      mockOrdersRepository.save(ordersData);
      const orders = await controller.getOrders();
      expect(orders).toEqual(mockOrdersRepository.entities);
    });
  });

  describe('getOrder', () => {
    it('should return an order with given id', async () => {
      const createData = generate(OrderCreateDto, false);
      const { id } = mockOrdersRepository.save(createData);
      const order = await controller.getOrder(null, id);
      expect(order).toEqual(
        mockOrdersRepository.entities.find((o) => o.id === id),
      );
    });

    it('should return order with given id and user id', async () => {
      const userData = generate(RegisterDto, false);
      const user = mockUsersRepository.save(userData);
      const createData = generate(OrderCreateDto, false);
      createData.items = [generate(OrderItemDto, false)];
      const { id: productId } = await mockProductsRepository.save(
        generate(ProductCreateDto, false),
      );
      createData.items[0].productId = productId;
      const { id } = await controller.createOrder(user, createData);
      const order = await controller.getOrder(user, id);
      expect(order).toEqual(
        mockOrdersRepository.entities.find((o) => o.id === id),
      );
    });

    it('should throw error if order with given id does not exist', async () => {
      await expect(controller.getOrder(null, 12345)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw error if order has different user id', async () => {
      const usersData = generate(RegisterDto, false, 2);
      const users = mockUsersRepository.save(usersData);
      const createData = generate(OrderCreateDto, false);
      createData.items = [generate(OrderItemDto, false)];
      const { id: productId } = await mockProductsRepository.save(
        generate(ProductCreateDto, false),
      );
      createData.items[0].productId = productId;
      const { id } = await controller.createOrder(users[0], createData);
      await expect(controller.getOrder(users[1], id)).rejects.toThrow(
        ForbiddenException,
      );
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
      const order = await controller.createOrder(null, createData);
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
      const order = await controller.updateOrder(id, updateData);
      expect(order).toEqual(
        mockOrdersRepository.entities.find((o) => o.id === id),
      );
      const { items, ...expected } = updateData;
      expect(order).toMatchObject(expected);
    });

    it('should th if order with given id does not exist', async () => {
      const updateData = generate(OrderUpdateDto, true);
      await expect(controller.updateOrder(12345, updateData)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
