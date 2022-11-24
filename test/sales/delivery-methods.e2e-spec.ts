import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { Role } from '../../src/users/models/role.enum';
import { TestUsersService } from '../utils/test-users/test-users.service';
import { TestUsersModule } from '../utils/test-users/test-users.module';
import { DtoGeneratorService } from '../utils/dto-generator/dto-generator.service';
import { setupRbacTests } from '../utils/setup-rbac-tests';
import { DeliveryMethodDto } from '../../src/sales/delivery-methods/dto/delivery-method.dto';

describe.only('DeliveryMethodsController (e2e)', () => {
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

  describe('/delivery-methods (GET)', () => {
    it('should return all delivery methods', async () => {
      const createData = generate(DeliveryMethodDto);
      await request(app.getHttpServer())
        .post('/delivery-methods')
        .set('Cookie', cookieHeader)
        .send(createData);
      const response = await request(app.getHttpServer())
        .get('/delivery-methods')
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(200);
      expect(response.body).toContainEqual({
        ...createData,
        id: expect.any(Number),
      });
    });
  });

  describe('/delivery-methods (POST)', () => {
    it('should create a delivery method', async () => {
      const createData = generate(DeliveryMethodDto);
      const response = await request(app.getHttpServer())
        .post('/delivery-methods')
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
        .post('/delivery-methods')
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

  describe('/delivery-methods/:id (PUT)', () => {
    it('should update a delivery method', async () => {
      const createData = generate(DeliveryMethodDto);
      const { id } = (
        await request(app.getHttpServer())
          .post('/delivery-methods')
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body;
      const updateData = generate(DeliveryMethodDto);
      const response = await request(app.getHttpServer())
        .put(`/delivery-methods/${id}`)
        .set('Cookie', cookieHeader)
        .send(updateData);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ...updateData,
        id,
      });
    });

    it('should return error if method is not found', async () => {
      const updateData = generate(DeliveryMethodDto);
      const response = await request(app.getHttpServer())
        .put('/delivery-methods/12345')
        .set('Cookie', cookieHeader)
        .send(updateData);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        message: ['delivery method with id=12345 not found'],
        error: 'Not Found',
      });
    });

    it('should return error if the data is invalid', async () => {
      const createData = generate(DeliveryMethodDto);
      const { id } = (
        await request(app.getHttpServer())
          .post('/delivery-methods')
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body;
      const response = await request(app.getHttpServer())
        .put(`/delivery-methods/${id}`)
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

  describe('/delivery-methods/:id (DELETE)', () => {
    it('should delete a delivery method', async () => {
      const createData = generate(DeliveryMethodDto);
      const { id } = (
        await request(app.getHttpServer())
          .post('/delivery-methods')
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body;
      const response = await request(app.getHttpServer())
        .delete(`/delivery-methods/${id}`)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(200);
    });

    it('should return error if method is not found', async () => {
      const response = await request(app.getHttpServer())
        .delete('/delivery-methods/12345')
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        message: ['delivery method with id=12345 not found'],
        error: 'Not Found',
      });
    });
  });

  describe(
    'RBAC for /delivery-methods',
    setupRbacTests(
      () => app,
      () => testUsers,
      [
        [
          '/delivery-methods (GET)',
          [Role.Admin, Role.Manager, Role.Sales, Role.Customer, Role.Disabled],
        ],
        ['/delivery-methods (POST)', [Role.Admin]],
        ['/delivery-methods/:id (PUT)', [Role.Admin]],
        ['/delivery-methods/:id (DELETE)', [Role.Admin]],
      ],
    ),
  );
});
