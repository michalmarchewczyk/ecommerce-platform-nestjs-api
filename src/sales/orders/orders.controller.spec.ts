import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { UsersService } from '../../users/users.service';
import { ProductsService } from '../../catalog/products/products.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RepositoryMockService } from '../../../test/utils/repository-mock/repository-mock.service';
import { Order } from './models/order.entity';
import { User } from '../../users/models/user.entity';
import { Product } from '../../catalog/products/models/product.entity';
import { Attribute } from '../../catalog/products/models/attribute.entity';
import { OrderCreateDto } from './dto/order-create.dto';
import { RegisterDto } from '../../auth/dto/register.dto';
import { DtoGeneratorService } from '../../../test/utils/dto-generator/dto-generator.service';
import { ForbiddenException } from '@nestjs/common';
import { OrderUpdateDto } from './dto/order-update.dto';
import { OrderItemDto } from './dto/order-item.dto';
import { ProductCreateDto } from '../../catalog/products/dto/product-create.dto';
import { DeliveryMethodsService } from '../delivery-methods/delivery-methods.service';
import { DeliveryMethod } from '../delivery-methods/models/delivery-method.entity';
import { OrderDeliveryDto } from './dto/order-delivery.dto';
import { DeliveryMethodDto } from '../delivery-methods/dto/delivery-method.dto';
import { OrderPaymentDto } from './dto/order-payment.dto';
import { PaymentMethodDto } from '../payment-methods/dto/payment-method.dto';
import { PaymentMethod } from '../payment-methods/models/payment-method.entity';
import { PaymentMethodsService } from '../payment-methods/payment-methods.service';
import { NotFoundError } from '../../errors/not-found.error';
import { AttributeType } from '../../catalog/attribute-types/models/attribute-type.entity';
import { LocalFilesService } from '../../local-files/local-files.service';
import { ProductPhoto } from '../../catalog/products/product-photos/models/product-photo.entity';
import { AttributeTypesService } from '../../catalog/attribute-types/attribute-types.service';

describe('OrdersController', () => {
  let controller: OrdersController;
  let mockOrdersRepository: RepositoryMockService<Order>;
  let mockUsersRepository: RepositoryMockService<User>;
  let mockProductsRepository: RepositoryMockService<Product>;
  let mockDeliveryMethodsRepository: RepositoryMockService<DeliveryMethod>;
  let mockPaymentMethodsRepository: RepositoryMockService<PaymentMethod>;
  let generate: DtoGeneratorService['generate'];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        OrdersService,
        UsersService,
        ProductsService,
        AttributeTypesService,
        DeliveryMethodsService,
        PaymentMethodsService,
        RepositoryMockService.getProvider(Order),
        RepositoryMockService.getProvider(User),
        RepositoryMockService.getProvider(Product),
        RepositoryMockService.getProvider(Attribute),
        RepositoryMockService.getProvider(DeliveryMethod),
        RepositoryMockService.getProvider(PaymentMethod),
        RepositoryMockService.getProvider(AttributeType),
        RepositoryMockService.getProvider(ProductPhoto),
        DtoGeneratorService,
        {
          provide: LocalFilesService,
          useValue: {
            createPhotoThumbnail: jest.fn((v: string) => v + '-thumbnail'),
          },
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    mockOrdersRepository = module.get(getRepositoryToken(Order));
    mockUsersRepository = module.get(getRepositoryToken(User));
    mockProductsRepository = module.get(getRepositoryToken(Product));
    mockDeliveryMethodsRepository = module.get(
      getRepositoryToken(DeliveryMethod),
    );
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

  describe('getOrders', () => {
    it('should return an array of orders', async () => {
      const ordersData = generate(OrderCreateDto, false, 4);
      mockOrdersRepository.save(ordersData);
      const orders = await controller.getOrders();
      expect(orders).toEqual(mockOrdersRepository.entities);
    });
  });

  describe('getUserOrders', () => {
    it('should return an array of user orders', async () => {
      const ordersData = generate(OrderCreateDto, false, 4);
      const ordersData2 = generate(OrderCreateDto, false, 4);
      mockOrdersRepository.save(
        ordersData.map((order) => ({ ...order, user: { id: 1 } })),
      );
      mockOrdersRepository.save(
        ordersData2.map((order) => ({ ...order, user: { id: 2 } })),
      );
      const orders = await controller.getUserOrders({ id: 1 } as User);
      expect(orders).toHaveLength(4);
      expect(orders).toEqual(
        mockOrdersRepository.entities.filter((e) => e.user?.id === 1),
      );
    });
  });

  describe('getOrder', () => {
    it('should return an order with given id', async () => {
      const createData = generate(OrderCreateDto, false);
      const { id } = mockOrdersRepository.save(createData);
      const order = await controller.getOrder({ id: 12345 } as User, id);
      expect(order).toEqual(
        mockOrdersRepository.entities.find((o) => o.id === id),
      );
    });

    it('should return order with given id and user id', async () => {
      const userData = generate(RegisterDto, false);
      const user = mockUsersRepository.save(userData);
      const createData = generate(OrderCreateDto, false);
      createData.items = [generate(OrderItemDto, false)];
      createData.delivery = generate(OrderDeliveryDto);
      createData.payment = generate(OrderPaymentDto);
      const { id: productId } = await mockProductsRepository.save(
        generate(ProductCreateDto, false),
      );
      const { id: deliveryMethodId } = await mockDeliveryMethodsRepository.save(
        generate(DeliveryMethodDto, false),
      );
      const { id: paymentMethodId } = await mockPaymentMethodsRepository.save(
        generate(PaymentMethodDto, false),
      );
      createData.items[0].productId = productId;
      createData.delivery.methodId = deliveryMethodId;
      createData.payment.methodId = paymentMethodId;
      const { id } = await controller.createOrder(user, createData);
      const order = await controller.getOrder(user, id);
      expect(order).toEqual(
        mockOrdersRepository.entities.find((o) => o.id === id),
      );
    });

    it('should throw error if order with given id does not exist', async () => {
      await expect(
        controller.getOrder({ id: 12345 } as User, 12345),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw error if order has different user id', async () => {
      const usersData = generate(RegisterDto, false, 2);
      const users = mockUsersRepository.save(usersData);
      const createData = generate(OrderCreateDto, false);
      createData.items = [generate(OrderItemDto, false)];
      createData.delivery = generate(OrderDeliveryDto);
      createData.payment = generate(OrderPaymentDto);
      const { id: productId } = await mockProductsRepository.save(
        generate(ProductCreateDto, false),
      );
      const { id: deliveryMethodId } = await mockDeliveryMethodsRepository.save(
        generate(DeliveryMethodDto, false),
      );
      const { id: paymentMethodId } = await mockPaymentMethodsRepository.save(
        generate(PaymentMethodDto, false),
      );
      createData.items[0].productId = productId;
      createData.delivery.methodId = deliveryMethodId;
      createData.payment.methodId = paymentMethodId;
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
      createData.delivery = generate(OrderDeliveryDto);
      createData.payment = generate(OrderPaymentDto);
      const { id: productId } = await mockProductsRepository.save(
        generate(ProductCreateDto, false),
      );
      const { id: deliveryMethodId } = await mockDeliveryMethodsRepository.save(
        generate(DeliveryMethodDto, false),
      );
      const { id: paymentMethodId } = await mockPaymentMethodsRepository.save(
        generate(PaymentMethodDto, false),
      );
      createData.items[0].productId = productId;
      createData.delivery.methodId = deliveryMethodId;
      createData.payment.methodId = paymentMethodId;
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
      const { items, delivery, payment, ...expected } = updateData;
      expect(order).toMatchObject(expected);
    });

    it('should throw error if order with given id does not exist', async () => {
      const updateData = generate(OrderUpdateDto, true);
      await expect(controller.updateOrder(12345, updateData)).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
