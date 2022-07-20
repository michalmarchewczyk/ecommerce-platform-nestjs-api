import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Role } from '../src/users/entities/role.enum';
import { TestUsersService } from './utils/test-users/test-users.service';
import { TestUsersModule } from './utils/test-users/test-users.module';
import { DtoGeneratorService } from './utils/dto-generator/dto-generator.service';
import { ProductCreateDto } from '../src/products/dto/product-create.dto';
import { Product } from '../src/products/entities/product.entity';
import { setupRbacTests } from './utils/setup-rbac-tests';
import { OrderCreateDto } from '../src/orders/dto/order-create.dto';
import { Order } from '../src/orders/entities/order.entity';
import { OrderUpdateDto } from '../src/orders/dto/order-update.dto';
import { DeliveryMethodDto } from '../src/orders/dto/delivery-method.dto';
import { DeliveryMethod } from '../src/orders/entities/delivery-method.entity';
import { OrderDeliveryDto } from '../src/orders/dto/order-delivery.dto';

describe.only('OrdersController (e2e)', () => {
  let app: INestApplication;
  let testUsers: TestUsersService;
  let cookieHeader: string;
  let testProduct: Product;
  let testMethod: DeliveryMethod;
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
    testProduct = (
      await request(app.getHttpServer())
        .post('/products')
        .set('Cookie', cookieHeader)
        .send(productData)
    ).body;

    const methodData = generate(DeliveryMethodDto);
    testMethod = (
      await request(app.getHttpServer())
        .post('/deliveries')
        .set('Cookie', cookieHeader)
        .send(methodData)
    ).body;

    const createData = generate(OrderCreateDto);
    createData.items = [
      {
        productId: testProduct.id,
        quantity: 1,
      },
    ];
    createData.delivery = generate(OrderDeliveryDto);
    createData.delivery.methodId = testMethod.id;
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
      const { items, user, delivery, ...expected } = testOrder;
      expect(response.body).toContainEqual({
        ...expected,
        status: 'pending',
      });
    });
  });

  describe('/orders/:id (GET)', () => {
    it('should return order with given id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/orders/${testOrder.id}`)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(200);
      const { items, user, delivery, ...expected } = testOrder;
      expect(response.body).toEqual({
        ...expected,
        status: 'pending',
        items: [expect.any(Object)],
        user: expect.any(Object),
        delivery: expect.any(Object),
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
      createData.items = [
        {
          productId: testProduct.id,
          quantity: 1,
        },
      ];
      createData.delivery = generate(OrderDeliveryDto);
      createData.delivery.methodId = testMethod.id;
      const response2 = await request(app.getHttpServer())
        .post('/orders')
        .set('Cookie', cookieHeader)
        .send(createData);
      const { id } = response2.body;
      const response3 = await request(app.getHttpServer())
        .get(`/orders/${id}`)
        .set('Cookie', cookieHeader);
      expect(response3.status).toBe(200);
      const { products, user, delivery, ...expected } = response3.body;
      expect(response3.body).toEqual({
        ...expected,
        status: 'pending',
        items: [expect.any(Object)],
        user: expect.any(Object),
        delivery: expect.any(Object),
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
        message: ['order not found'],
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
      createData.items = [
        {
          productId: testProduct.id,
          quantity: 1,
        },
      ];
      createData.delivery = generate(OrderDeliveryDto);
      createData.delivery.methodId = testMethod.id;
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
        ],
      });
    });
  });

  describe('/orders/:id (PATCH)', () => {
    it('should update order', async () => {
      const createData = generate(OrderCreateDto);
      createData.items = [
        {
          productId: testProduct.id,
          quantity: 1,
        },
      ];
      createData.delivery = generate(OrderDeliveryDto);
      createData.delivery.methodId = testMethod.id;
      const { id } = (
        await request(app.getHttpServer())
          .post('/orders')
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body;
      const updateData = generate(OrderUpdateDto, true);
      const response = await request(app.getHttpServer())
        .patch(`/orders/${id}`)
        .set('Cookie', cookieHeader)
        .send(updateData);
      expect(response.status).toBe(200);
      const { items, delivery, ...expected } = updateData;
      expect(response.body).toEqual({
        ...expected,
        id,
        created: expect.any(String),
        updated: expect.any(String),
        items: [expect.any(Object)],
        user: expect.any(Object),
        delivery: expect.any(Object),
      });
    });

    it('should return error if data is invalid', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/orders/${testOrder.id}`)
        .set('Cookie', cookieHeader)
        .send({
          status: '12345',
        });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        statusCode: 400,
        error: 'Bad Request',
        message: ['status must be a valid enum value'],
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
