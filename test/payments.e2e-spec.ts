import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Role } from '../src/users/entities/role.enum';
import { TestUsersService } from './utils/test-users/test-users.service';
import { TestUsersModule } from './utils/test-users/test-users.module';
import { DtoGeneratorService } from './utils/dto-generator/dto-generator.service';
import { setupRbacTests } from './utils/setup-rbac-tests';
import { PaymentMethodDto } from '../src/orders/dto/payment-method.dto';

describe.only('PaymentsController (e2e)', () => {
  let app: INestApplication;
  let testUsers: TestUsersService;
  let cookieHeader: string;
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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/payments (GET)', () => {
    it('should return all payment methods', async () => {
      const createData = generate(PaymentMethodDto);
      await request(app.getHttpServer())
        .post('/payments')
        .set('Cookie', cookieHeader)
        .send(createData);
      const response = await request(app.getHttpServer())
        .get('/payments')
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(200);
      expect(response.body).toContainEqual({
        ...createData,
        id: expect.any(Number),
      });
    });
  });

  describe('/payments (POST)', () => {
    it('should create a payment method', async () => {
      const createData = generate(PaymentMethodDto);
      const response = await request(app.getHttpServer())
        .post('/payments')
        .set('Cookie', cookieHeader)
        .send(createData);
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        ...createData,
        id: expect.any(Number),
      });
    });

    it('should return error if the data is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/payments')
        .set('Cookie', cookieHeader)
        .send({
          name: '',
        });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        statusCode: 400,
        message: [
          'name should not be empty',
          'description must be a string',
          'price should not be empty',
          'price must be a number conforming to the specified constraints',
        ],
        error: 'Bad Request',
      });
    });
  });

  describe('/payments/:id (PUT)', () => {
    it('should update a payment method', async () => {
      const createData = generate(PaymentMethodDto);
      const { id } = (
        await request(app.getHttpServer())
          .post('/payments')
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body;
      const updateData = generate(PaymentMethodDto);
      const response = await request(app.getHttpServer())
        .put(`/payments/${id}`)
        .set('Cookie', cookieHeader)
        .send(updateData);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ...updateData,
        id,
      });
    });

    it('should return error if method is not found', async () => {
      const updateData = generate(PaymentMethodDto);
      const response = await request(app.getHttpServer())
        .put('/payments/12345')
        .set('Cookie', cookieHeader)
        .send(updateData);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        message: ['payment method with id=12345 not found'],
        error: 'Not Found',
      });
    });

    it('should return error if the data is invalid', async () => {
      const createData = generate(PaymentMethodDto);
      const { id } = (
        await request(app.getHttpServer())
          .post('/payments')
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body;
      const response = await request(app.getHttpServer())
        .put(`/payments/${id}`)
        .set('Cookie', cookieHeader)
        .send({
          name: '',
        });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        statusCode: 400,
        message: [
          'name should not be empty',
          'description must be a string',
          'price should not be empty',
          'price must be a number conforming to the specified constraints',
        ],
        error: 'Bad Request',
      });
    });
  });

  describe('/payments/:id (DELETE)', () => {
    it('should delete a payment method', async () => {
      const createData = generate(PaymentMethodDto);
      const { id } = (
        await request(app.getHttpServer())
          .post('/payments')
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body;
      const response = await request(app.getHttpServer())
        .delete(`/payments/${id}`)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(200);
    });

    it('should return error if method is not found', async () => {
      const response = await request(app.getHttpServer())
        .delete('/payments/12345')
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        message: ['payment method with id=12345 not found'],
        error: 'Not Found',
      });
    });
  });

  describe(
    'RBAC for /payments',
    setupRbacTests(
      () => app,
      () => testUsers,
      [
        [
          '/payments (GET)',
          [Role.Admin, Role.Manager, Role.Sales, Role.Customer, Role.Disabled],
        ],
        ['/payments (POST)', [Role.Admin]],
        ['/payments/:id (PUT)', [Role.Admin]],
        ['/payments/:id (DELETE)', [Role.Admin]],
      ],
    ),
  );
});
