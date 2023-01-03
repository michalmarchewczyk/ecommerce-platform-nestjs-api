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
import { DeliveryMethodDto } from '../../src/sales/delivery-methods/dto/delivery-method.dto';
import { DeliveryMethod } from '../../src/sales/delivery-methods/models/delivery-method.entity';
import { OrderDeliveryDto } from '../../src/sales/orders/dto/order-delivery.dto';
import { PaymentMethod } from '../../src/sales/payment-methods/models/payment-method.entity';
import { PaymentMethodDto } from '../../src/sales/payment-methods/dto/payment-method.dto';
import { OrderPaymentDto } from '../../src/sales/orders/dto/order-payment.dto';
import { ReturnCreateDto } from '../../src/sales/returns/dto/return-create.dto';
import { Return } from '../../src/sales/returns/models/return.entity';
import { ReturnUpdateDto } from '../../src/sales/returns/dto/return-update.dto';
import { ReturnStatus } from '../../src/sales/returns/models/return-status.enum';

describe.only('OrdersController (e2e)', () => {
  let app: INestApplication;
  let testUsers: TestUsersService;
  let cookieHeader: string;
  let testProduct: Product;
  let testDeliveryMethod: DeliveryMethod;
  let testPaymentMethod: PaymentMethod;
  let testOrder: Order;
  let testReturn: Return;
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

    const orderData = generate(OrderCreateDto);
    orderData.items = [
      {
        productId: testProduct.id,
        quantity: 1,
      },
    ];
    orderData.delivery = generate(OrderDeliveryDto);
    orderData.delivery.methodId = testDeliveryMethod.id;
    orderData.payment = generate(OrderPaymentDto);
    orderData.payment.methodId = testPaymentMethod.id;
    testOrder = (
      await request(app.getHttpServer())
        .post('/orders')
        .set('Cookie', cookieHeader)
        .send(orderData)
    ).body;

    const createData = generate(ReturnCreateDto);
    createData.orderId = testOrder.id;
    testReturn = (
      await request(app.getHttpServer())
        .post('/returns')
        .set('Cookie', cookieHeader)
        .send(createData)
    ).body;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/returns (GET)', () => {
    it('should return all returns', async () => {
      const response = await request(app.getHttpServer())
        .get('/returns')
        .set('Cookie', cookieHeader);
      expect(response.body).toContainEqual({
        ...testReturn,
        order: expect.anything(),
      });
    });
  });

  describe('/returns/:id (GET)', () => {
    it('should return a return by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/returns/${testReturn.id}`)
        .set('Cookie', cookieHeader);
      expect(response.body).toEqual({
        ...testReturn,
        id: expect.any(Number),
        order: expect.any(Object),
      });
    });

    it('should return error if return does not belong to user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          ...testUsers.getCredentials(Role.Customer),
        });
      const cookieHeader = response.headers['set-cookie'];
      const response2 = await request(app.getHttpServer())
        .get(`/returns/${testReturn.id}`)
        .set('Cookie', cookieHeader);
      expect(response2.status).toBe(403);
      expect(response2.body).toEqual({
        message: 'Forbidden',
        statusCode: 403,
      });
    });

    it('should return error if the return does not exist', async () => {
      const response = await request(app.getHttpServer())
        .get('/returns/12345')
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Not Found',
        message: ['return with id=12345 not found'],
        statusCode: 404,
      });
    });
  });

  describe('/returns (POST)', () => {
    it('should create a new return', async () => {
      const orderData = generate(OrderCreateDto);
      orderData.items = [
        {
          productId: testProduct.id,
          quantity: 1,
        },
      ];
      orderData.delivery = generate(OrderDeliveryDto);
      orderData.delivery.methodId = testDeliveryMethod.id;
      orderData.payment = generate(OrderPaymentDto);
      orderData.payment.methodId = testPaymentMethod.id;
      const order = (
        await request(app.getHttpServer())
          .post('/orders')
          .set('Cookie', cookieHeader)
          .send(orderData)
      ).body;
      const createData = generate(ReturnCreateDto);
      createData.orderId = order.id;
      const response = await request(app.getHttpServer())
        .post('/returns')
        .set('Cookie', cookieHeader)
        .send(createData);
      const { orderId, ...expected } = createData;
      expect(response.body).toMatchObject(expected);
    });

    it('should return error if order does not belong to user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          ...testUsers.getCredentials(Role.Customer),
        });
      const cookieHeader = response.headers['set-cookie'];
      const createData = generate(ReturnCreateDto);
      createData.orderId = testOrder.id;
      const response2 = await request(app.getHttpServer())
        .post(`/returns/`)
        .set('Cookie', cookieHeader)
        .send(createData);
      expect(response2.status).toBe(403);
      expect(response2.body).toEqual({
        message: 'Forbidden',
        statusCode: 403,
      });
    });

    it('should return error if the order does not exist', async () => {
      const createData = generate(ReturnCreateDto);
      createData.orderId = 12345;
      const response = await request(app.getHttpServer())
        .post('/returns')
        .set('Cookie', cookieHeader)
        .send(createData);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Not Found',
        message: ['order with id=12345 not found'],
        statusCode: 404,
      });
    });

    it('should return error if the order is already returned', async () => {
      const createData = generate(ReturnCreateDto);
      createData.orderId = testOrder.id;
      await request(app.getHttpServer())
        .post('/returns')
        .set('Cookie', cookieHeader)
        .send(createData);
      const response = await request(app.getHttpServer())
        .post('/returns')
        .set('Cookie', cookieHeader)
        .send(createData);
      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        error: 'Conflict',
        message: ['return could not be saved because of a data conflict'],
        statusCode: 409,
      });
    });
  });

  describe('/returns/:id (PATCH)', () => {
    it('should update a return', async () => {
      const orderData = generate(OrderCreateDto);
      orderData.items = [
        {
          productId: testProduct.id,
          quantity: 1,
        },
      ];
      orderData.delivery = generate(OrderDeliveryDto);
      orderData.delivery.methodId = testDeliveryMethod.id;
      orderData.payment = generate(OrderPaymentDto);
      orderData.payment.methodId = testPaymentMethod.id;
      const order = (
        await request(app.getHttpServer())
          .post('/orders')
          .set('Cookie', cookieHeader)
          .send(orderData)
      ).body;
      const createData = generate(ReturnCreateDto);
      createData.orderId = order.id;
      const { id } = (
        await request(app.getHttpServer())
          .post('/returns')
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body;
      const updateData = generate(ReturnUpdateDto);
      updateData.status = ReturnStatus.Cancelled;
      const response = await request(app.getHttpServer())
        .patch(`/returns/${id}`)
        .set('Cookie', cookieHeader)
        .send(updateData);
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject(updateData);
      updateData.status = ReturnStatus.Completed;
      const response2 = await request(app.getHttpServer())
        .patch(`/returns/${id}`)
        .set('Cookie', cookieHeader)
        .send(updateData);
      expect(response2.status).toBe(200);
      expect(response2.body).toMatchObject(updateData);
    });

    it('should return error if the return does not exist', async () => {
      const updateData = generate(ReturnUpdateDto);
      const response = await request(app.getHttpServer())
        .patch('/returns/12345')
        .set('Cookie', cookieHeader)
        .send(updateData);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Not Found',
        message: ['return with id=12345 not found'],
        statusCode: 404,
      });
    });
  });

  describe(
    'RBAC for /returns',
    setupRbacTests(
      () => app,
      () => testUsers,
      [
        ['/returns (GET)', [Role.Admin, Role.Manager, Role.Sales]],
        ['/returns/:id (GET)', [Role.Admin, Role.Manager, Role.Sales]],
        [
          '/returns (POST)',
          [Role.Admin, Role.Manager, Role.Sales, Role.Customer],
        ],
        ['/returns/:id (PATCH)', [Role.Admin, Role.Manager, Role.Sales]],
      ],
    ),
  );
});
