import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Role } from '../src/users/entities/role.enum';
import { TestUsersService } from './utils/test-users/test-users.service';
import { TestUsersModule } from './utils/test-users/test-users.module';
import { DtoGeneratorService } from './utils/dto-generator/dto-generator.service';
import { AttributeType } from '../src/products/entities/attribute-type.entity';
import { AttributeTypeDto } from '../src/products/dto/attribute-type.dto';
import { setupRbacTests } from './utils/setup-rbac-tests';

describe('ProductsController (e2e)', () => {
  let app: INestApplication;
  let testUsers: TestUsersService;
  let cookieHeader: string;
  let testAttributeType: AttributeType;
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

    testAttributeType = (
      await request(app.getHttpServer())
        .post('/attributes')
        .set('Cookie', cookieHeader)
        .send({
          name: 'Test attribute',
          valueType: 'string',
        })
    ).body;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/attributes (GET)', () => {
    it('should return all attribute types', async () => {
      const response = await request(app.getHttpServer())
        .get('/attributes')
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(200);
      expect(response.body).toContainEqual(testAttributeType);
    });
  });

  describe('/attributes (POST)', () => {
    it('should create new attribute type', async () => {
      const createData = generate(AttributeTypeDto);
      const response = await request(app.getHttpServer())
        .post('/attributes')
        .set('Cookie', cookieHeader)
        .send(createData);
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        id: expect.any(Number),
        ...createData,
      });
    });

    it('should return error when data is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/attributes')
        .set('Cookie', cookieHeader)
        .send({
          name: '',
          valueType: '',
        });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        statusCode: 400,
        message: [
          'name should not be empty',
          'valueType must be a valid enum value',
        ],
        error: 'Bad Request',
      });
    });
  });

  describe('/attributes/:id (PUT)', () => {
    it('should update attribute type', async () => {
      const createData = generate(AttributeTypeDto);
      const id = (
        await request(app.getHttpServer())
          .post('/attributes')
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body.id;
      const updateData = generate(AttributeTypeDto);
      const response = await request(app.getHttpServer())
        .put(`/attributes/${id}`)
        .set('Cookie', cookieHeader)
        .send(updateData);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id,
        ...updateData,
      });
    });

    it('should return error when data is invalid', async () => {
      const response = await request(app.getHttpServer())
        .put('/attributes/' + testAttributeType.id)
        .set('Cookie', cookieHeader)
        .send({
          name: '',
          valueType: '',
        });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        statusCode: 400,
        message: [
          'name should not be empty',
          'valueType must be a valid enum value',
        ],
        error: 'Bad Request',
      });
    });

    it('should return error when attribute type does not exist', async () => {
      const updateData = generate(AttributeTypeDto);
      const response = await request(app.getHttpServer())
        .put('/attributes/12345')
        .set('Cookie', cookieHeader)
        .send(updateData);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        message: ['attribute type not found'],
        error: 'Not Found',
      });
    });
  });

  describe('/attributes/:id (DELETE)', () => {
    it('should delete attribute type', async () => {
      const createData = generate(AttributeTypeDto);
      const id = (
        await request(app.getHttpServer())
          .post('/attributes')
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body.id;
      const response = await request(app.getHttpServer())
        .delete(`/attributes/${id}`)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({});
    });

    it('should return error when attribute type does not exist', async () => {
      const response = await request(app.getHttpServer())
        .delete('/attributes/12345')
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        message: ['attribute type not found'],
        error: 'Not Found',
      });
    });
  });

  describe(
    'RBAC for /attributes',
    setupRbacTests(
      () => app,
      () => testUsers,
      [
        ['/attributes (GET)', [Role.Admin, Role.Manager]],
        ['/attributes (POST)', [Role.Admin, Role.Manager]],
        ['/attributes/:id (PUT)', [Role.Admin, Role.Manager]],
        ['/attributes/:id (DELETE)', [Role.Admin, Role.Manager]],
      ],
    ),
  );
});
