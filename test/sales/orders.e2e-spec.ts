import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { Role } from '../../src/users/models/role.enum';
import { TestUsersService } from '../utils/test-users/test-users.service';
import { TestUsersModule } from '../utils/test-users/test-users.module';
import { DtoGeneratorService } from '../utils/dto-generator/dto-generator.service';
import { ProductCreateDto } from '../../src/catalog/products/dto/product-create.dto';
import { Product } from '../../src/catalog/products/models/product.entity';
import { setupRbacTests } from '../utils/setup-rbac-tests';
import { OrderCreateDto } from '../../src/sales/orders/dto/order-create.dto';
import { Order } from '../../src/sales/orders/models/order.entity';
import { OrderUpdateDto } from '../../src/sales/orders/dto/order-update.dto';
import { DeliveryMethodDto } from '../../src/sales/delivery-methods/dto/delivery-method.dto';
import { DeliveryMethod } from '../../src/sales/delivery-methods/models/delivery-method.entity';
import { OrderDeliveryDto } from '../../src/sales/orders/dto/order-delivery.dto';
import { PaymentMethod } from '../../src/sales/payment-methods/models/payment-method.entity';
import { PaymentMethodDto } from '../../src/sales/payment-methods/dto/payment-method.dto';
import { OrderPaymentDto } from '../../src/sales/orders/dto/order-payment.dto';
import { OrderStatus } from '../../src/sales/orders/models/order-status.enum';

describe.only('OrdersController (e2e)', () => {
  let app: INestApplication;
  let testUsers: TestUsersService;
  let cookieHeader: string;
  let testProduct: Product;
  let testDeliveryMethod: DeliveryMethod;
  let testPaymentMethod: PaymentMethod;
  let testOrder: Order;
  let generate: DtoGeneratorService['generate'];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, TestUsersModule],
      providers: [DtoGeneratorService],
    }).compile();

    app = moduleFixture.createNestApplication();
    testUsers = moduleFixture.get<TestUsersService>(TestUsersService);
    await app.init();
    await testUsers.init();

    generate = moduleFixture
      .get<DtoGeneratorService>(DtoGeneratorService)
      .generate.bind(
        moduleFixture.get<DtoGeneratorService>(DtoGeneratorService),
      );

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        ...testUsers.getCredentials(Role.Admin),
      });
    cookieHeader = response.headers['set-cookie'];

    const productData = generate(ProductCreateDto);
    productData.visible = true;
    testProduct = (
      await request(app.getHttpServer())
        .post('/products')
        .set('Cookie', cookieHeader)
        .send(productData)
    ).body;

    const deliveryMethodData = generate(DeliveryMethodDto);
    testDeliveryMethod = (
      await request(app.getHttpServer())
        .post('/delivery-methods')
        .set('Cookie', cookieHeader)
        .send(deliveryMethodData)
    ).body;

    const paymentMethodData = generate(PaymentMethodDto);
    testPaymentMethod = (
      await request(app.getHttpServer())
        .post('/payment-methods')
        .set('Cookie', cookieHeader)
        .send(paymentMethodData)
    ).body;

    const createData = generate(OrderCreateDto);
    createData.items = [{ productId: testProduct.id, quantity: 1 }];
    createData.delivery = generate(OrderDeliveryDto);
    createData.delivery.methodId = testDeliveryMethod.id;
    createData.payment = generate(OrderPaymentDto);
    createData.payment.methodId = testPaymentMethod.id;
    testOrder = (
      await request(app.getHttpServer())
        .post('/orders')
        .set('Cookie', cookieHeader)
        .send(createData)
    ).body;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/orders (GET)', () => {
    it('should return all orders', async () => {
      const response = await request(app.getHttpServer())
        .get('/orders')
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(200);
      const { items, user, delivery, payment, ...expected } = testOrder;
      expect(response.body).toContainEqual({
        ...expected,
        status: 'pending',
        delivery: expect.any(Object),
        payment: expect.any(Object),
        items: expect.any(Array),
        return: null,
      });
    });
  });

  describe('/orders/my (GET)', () => {
    it('should return current user orders', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          ...testUsers.getCredentials(Role.Customer),
        });
      const cookieHeader = response.headers['set-cookie'];
      const createData = generate(OrderCreateDto);
      createData.items = [{ productId: testProduct.id, quantity: 1 }];
      createData.delivery = generate(OrderDeliveryDto);
      createData.delivery.methodId = testDeliveryMethod.id;
      createData.payment = generate(OrderPaymentDto);
      createData.payment.methodId = testPaymentMethod.id;
      const response2 = await request(app.getHttpServer())
        .post('/orders')
        .set('Cookie', cookieHeader)
        .send(createData);
      const response3 = await request(app.getHttpServer())
        .get(`/orders/my`)
        .set('Cookie', cookieHeader);
      expect(response3.status).toBe(200);
      const { products, user, delivery, payment, ...expected } = response2.body;
      expect(response3.body).toContainEqual({
        ...expected,
        status: 'pending',
        items: [expect.any(Object)],
        user: expect.any(Object),
        delivery: expect.any(Object),
        payment: expect.any(Object),
        return: null,
      });
    });
  });

  describe('/orders/:id (GET)', () => {
    it('should return order with given id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/orders/${testOrder.id}`)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(200);
      const { items, user, delivery, payment, ...expected } = testOrder;
      expect(response.body).toEqual({
        ...expected,
        status: 'pending',
        items: [expect.any(Object)],
        user: expect.any(Object),
        delivery: expect.any(Object),
        payment: expect.any(Object),
        return: null,
      });
    });

    it('should return order with given id and user id', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          ...testUsers.getCredentials(Role.Customer),
        });
      const cookieHeader = response.headers['set-cookie'];
      const createData = generate(OrderCreateDto);
      createData.items = [{ productId: testProduct.id, quantity: 1 }];
      createData.delivery = generate(OrderDeliveryDto);
      createData.delivery.methodId = testDeliveryMethod.id;
      createData.payment = generate(OrderPaymentDto);
      createData.payment.methodId = testPaymentMethod.id;
      const response2 = await request(app.getHttpServer())
        .post('/orders')
        .set('Cookie', cookieHeader)
        .send(createData);
      const { id } = response2.body;
      const response3 = await request(app.getHttpServer())
        .get(`/orders/${id}`)
        .set('Cookie', cookieHeader);
      expect(response3.status).toBe(200);
      const { products, user, delivery, payment, ...expected } = response2.body;
      expect(response3.body).toEqual({
        ...expected,
        status: 'pending',
        items: [expect.any(Object)],
        user: expect.any(Object),
        delivery: expect.any(Object),
        payment: expect.any(Object),
        return: null,
      });
    });

    it('should return error if order with given id does not exist', async () => {
      const response = await request(app.getHttpServer())
        .get('/orders/12345')
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        error: 'Not Found',
        message: ['order with id=12345 not found'],
      });
    });

    it('should return error if order with given id is not owned by user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          ...testUsers.getCredentials(Role.Customer),
        });
      const cookieHeader = response.headers['set-cookie'];
      const response2 = await request(app.getHttpServer())
        .get(`/orders/${testOrder.id}`)
        .set('Cookie', cookieHeader);
      expect(response2.status).toBe(403);
      expect(response2.body).toEqual({
        statusCode: 403,
        message: 'Forbidden',
      });
    });
  });

  describe('/orders (POST)', () => {
    it('should create order', async () => {
      const createData = generate(OrderCreateDto);
      createData.items = [{ productId: testProduct.id, quantity: 1 }];
      createData.delivery = generate(OrderDeliveryDto);
      createData.delivery.methodId = testDeliveryMethod.id;
      createData.payment = generate(OrderPaymentDto);
      createData.payment.methodId = testPaymentMethod.id;
      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Cookie', cookieHeader)
        .send(createData);
      expect(response.status).toBe(201);
      const { products, user, ...expected } = response.body;
      expect(response.body).toEqual({
        ...expected,
        status: 'pending',
        items: [expect.any(Object)],
        user: expect.any(Object),
      });
    });

    it('should create order without user account', async () => {
      const createData = generate(OrderCreateDto);
      createData.items = [{ productId: testProduct.id, quantity: 1 }];
      createData.delivery = generate(OrderDeliveryDto);
      createData.delivery.methodId = testDeliveryMethod.id;
      createData.payment = generate(OrderPaymentDto);
      createData.payment.methodId = testPaymentMethod.id;
      const response = await request(app.getHttpServer())
        .post('/orders')
        .send(createData);
      expect(response.status).toBe(201);
      const { products, user, ...expected } = response.body;
      expect(response.body).toEqual({
        ...expected,
        status: 'pending',
        items: [expect.any(Object)],
      });
    });

    it('should create failed order', async () => {
      const createData = generate(OrderCreateDto);
      createData.items = [{ productId: testProduct.id, quantity: 2147483647 }];
      createData.delivery = generate(OrderDeliveryDto);
      createData.delivery.methodId = testDeliveryMethod.id;
      createData.payment = generate(OrderPaymentDto);
      createData.payment.methodId = testPaymentMethod.id;
      const response = await request(app.getHttpServer())
        .post('/orders')
        .send(createData);
      expect(response.status).toBe(201);
      const { products, user, ...expected } = response.body;
      expect(response.body).toEqual({
        ...expected,
        status: 'failed',
        items: [expect.any(Object)],
      });
    });

    it('should return error if product does not exist', async () => {
      const createData = generate(OrderCreateDto);
      createData.items = [{ productId: 12345, quantity: 1 }];
      createData.delivery = generate(OrderDeliveryDto);
      createData.delivery.methodId = testDeliveryMethod.id;
      createData.payment = generate(OrderPaymentDto);
      createData.payment.methodId = testPaymentMethod.id;
      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Cookie', cookieHeader)
        .send(createData);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        error: 'Not Found',
        message: ['product with id=12345 not found'],
      });
    });

    it('should return error if delivery method does not exist', async () => {
      const createData = generate(OrderCreateDto);
      createData.items = [{ productId: testProduct.id, quantity: 1 }];
      createData.delivery = generate(OrderDeliveryDto);
      createData.delivery.methodId = 12345;
      createData.payment = generate(OrderPaymentDto);
      createData.payment.methodId = testPaymentMethod.id;
      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Cookie', cookieHeader)
        .send(createData);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        error: 'Not Found',
        message: ['delivery method with id=12345 not found'],
      });
    });

    it('should return error if payment method does not exist', async () => {
      const createData = generate(OrderCreateDto);
      createData.items = [{ productId: testProduct.id, quantity: 1 }];
      createData.delivery = generate(OrderDeliveryDto);
      createData.delivery.methodId = testDeliveryMethod.id;
      createData.payment = generate(OrderPaymentDto);
      createData.payment.methodId = 12345;
      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Cookie', cookieHeader)
        .send(createData);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        error: 'Not Found',
        message: ['payment method with id=12345 not found'],
      });
    });

    it('should return error if data is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Cookie', cookieHeader)
        .send({});
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        statusCode: 400,
        error: 'Bad Request',
        message: [
          'each value in items must be a non-empty object',
          'each value in items should not be empty',
          'fullName should not be empty',
          'fullName must be a string',
          'contactEmail should not be empty',
          'contactEmail must be an email',
          'contactPhone should not be empty',
          'contactPhone must be a valid phone number',
          'delivery must be a non-empty object',
          'delivery should not be empty',
          'payment must be a non-empty object',
          'payment should not be empty',
        ],
      });
    });
  });

  describe('/orders/:id (PATCH)', () => {
    let testOrderId: number;

    beforeEach(async () => {
      const createData = generate(OrderCreateDto);
      createData.items = [{ productId: testProduct.id, quantity: 1 }];
      createData.delivery = generate(OrderDeliveryDto);
      createData.delivery.methodId = testDeliveryMethod.id;
      createData.payment = generate(OrderPaymentDto);
      createData.payment.methodId = testPaymentMethod.id;
      testOrderId = (
        await request(app.getHttpServer())
          .post('/orders')
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body.id;
    });

    it('should update order', async () => {
      const updateData = generate(OrderUpdateDto, true);
      updateData.status = OrderStatus.Cancelled;
      updateData.items = [{ productId: testProduct.id, quantity: 10 }];
      updateData.delivery = generate(OrderDeliveryDto);
      updateData.delivery.methodId = testDeliveryMethod.id;
      updateData.payment = generate(OrderPaymentDto);
      updateData.payment.methodId = testPaymentMethod.id;
      const response = await request(app.getHttpServer())
        .patch(`/orders/${testOrderId}`)
        .set('Cookie', cookieHeader)
        .send(updateData);
      expect(response.status).toBe(200);
      const { items, delivery, payment, ...expected } = updateData;
      expect(response.body).toEqual({
        ...expected,
        id: testOrderId,
        created: expect.any(String),
        updated: expect.any(String),
        items: [expect.any(Object)],
        user: expect.any(Object),
        delivery: expect.any(Object),
        payment: expect.any(Object),
        return: null,
      });
      updateData.status = OrderStatus.Open;
      const response2 = await request(app.getHttpServer())
        .patch(`/orders/${testOrderId}`)
        .set('Cookie', cookieHeader)
        .send(updateData);
      expect(response2.status).toBe(200);
      expect(response2.body.status).toBe(OrderStatus.Open);
    });

    it('should set status to failed', async () => {
      const updateData = generate(OrderUpdateDto, true);
      updateData.status = OrderStatus.Cancelled;
      updateData.items = [{ productId: testProduct.id, quantity: 2147483647 }];
      updateData.delivery = generate(OrderDeliveryDto);
      updateData.delivery.methodId = testDeliveryMethod.id;
      updateData.payment = generate(OrderPaymentDto);
      updateData.payment.methodId = testPaymentMethod.id;
      const response = await request(app.getHttpServer())
        .patch(`/orders/${testOrderId}`)
        .set('Cookie', cookieHeader)
        .send(updateData);
      expect(response.status).toBe(200);
      expect(response.body.status).toBe(OrderStatus.Failed);
      updateData.items = undefined;
      updateData.status = OrderStatus.Delivered;
      const response2 = await request(app.getHttpServer())
        .patch(`/orders/${testOrderId}`)
        .set('Cookie', cookieHeader)
        .send(updateData);
      expect(response2.status).toBe(200);
      expect(response2.body.status).toBe(OrderStatus.Failed);
    });

    it('should return error if order does not exist', async () => {
      const updateData = generate(OrderUpdateDto, true);
      updateData.items = [{ productId: testProduct.id, quantity: 10 }];
      updateData.delivery = generate(OrderDeliveryDto);
      updateData.delivery.methodId = testDeliveryMethod.id;
      updateData.payment = generate(OrderPaymentDto);
      updateData.payment.methodId = testPaymentMethod.id;
      const response = await request(app.getHttpServer())
        .patch(`/orders/${12345}`)
        .set('Cookie', cookieHeader)
        .send(updateData);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        error: 'Not Found',
        message: ['order with id=12345 not found'],
      });
    });

    it('should return error if product does not exist', async () => {
      const updateData = generate(OrderUpdateDto, true);
      updateData.items = [{ productId: 12345, quantity: 10 }];
      updateData.delivery = generate(OrderDeliveryDto);
      updateData.delivery.methodId = testDeliveryMethod.id;
      updateData.payment = generate(OrderPaymentDto);
      updateData.payment.methodId = testPaymentMethod.id;
      const response = await request(app.getHttpServer())
        .patch(`/orders/${testOrderId}`)
        .set('Cookie', cookieHeader)
        .send(updateData);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        error: 'Not Found',
        message: ['product with id=12345 not found'],
      });
    });

    it('should return error if delivery method does not exist', async () => {
      const updateData = generate(OrderUpdateDto, true);
      updateData.items = [{ productId: testProduct.id, quantity: 10 }];
      updateData.delivery = generate(OrderDeliveryDto);
      updateData.delivery.methodId = 12345;
      updateData.payment = generate(OrderPaymentDto);
      updateData.payment.methodId = testPaymentMethod.id;
      const response = await request(app.getHttpServer())
        .patch(`/orders/${testOrderId}`)
        .set('Cookie', cookieHeader)
        .send(updateData);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        error: 'Not Found',
        message: ['delivery method with id=12345 not found'],
      });
    });

    it('should return error if payment method does not exist', async () => {
      const updateData = generate(OrderUpdateDto, true);
      updateData.items = [{ productId: testProduct.id, quantity: 10 }];
      updateData.delivery = generate(OrderDeliveryDto);
      updateData.delivery.methodId = testDeliveryMethod.id;
      updateData.payment = generate(OrderPaymentDto);
      updateData.payment.methodId = 12345;
      const response = await request(app.getHttpServer())
        .patch(`/orders/${testOrderId}`)
        .set('Cookie', cookieHeader)
        .send(updateData);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        error: 'Not Found',
        message: ['payment method with id=12345 not found'],
      });
    });

    it('should return error if data is invalid', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/orders/${testOrderId}`)
        .set('Cookie', cookieHeader)
        .send({
          status: '12345',
        });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        statusCode: 400,
        error: 'Bad Request',
        message: [
          'status must be one of the following values: pending, failed, confirmed, open, cancelled, delivered, refunded',
        ],
      });
    });
  });

  describe(
    'RBAC for /orders',
    setupRbacTests(
      () => app,
      () => testUsers,
      [
        ['/orders (GET)', [Role.Admin, Role.Manager, Role.Sales]],
        [
          '/orders/my (GET)',
          [Role.Admin, Role.Manager, Role.Sales, Role.Customer],
        ],
        ['/orders/:id (GET)', [Role.Admin, Role.Manager, Role.Sales]],
        [
          '/orders (POST)',
          [Role.Admin, Role.Manager, Role.Sales, Role.Customer, Role.Disabled],
        ],
        ['/orders/:id (PATCH)', [Role.Admin, Role.Manager, Role.Sales]],
      ],
    ),
  );
});
