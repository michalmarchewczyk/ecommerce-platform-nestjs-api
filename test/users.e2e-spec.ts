import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Role } from '../src/users/models/role.enum';
import { TestUsersService } from './utils/test-users/test-users.service';
import { TestUsersModule } from './utils/test-users/test-users.module';
import { RegisterDto } from '../src/auth/dto/register.dto';
import { DtoGeneratorService } from './utils/dto-generator/dto-generator.service';
import { UserUpdateDto } from '../src/users/dto/user-update.dto';
import { setupRbacTests } from './utils/setup-rbac-tests';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let testUsers: TestUsersService;
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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/users/me (GET)', () => {
    it('should return current user', async () => {
      const { headers } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          ...testUsers.getCredentials(Role.Customer),
        });
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Cookie', headers['set-cookie'])
        .send();
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: expect.any(Number),
        email: testUsers.getCredentials(Role.Customer).email,
        role: Role.Customer,
        registered: expect.any(String),
        firstName: null,
        lastName: null,
      });
    });

    it('should return 401 if user is not logged in', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .send();
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        statusCode: 401,
        message: ['unauthorized'],
        error: 'Unauthorized',
      });
    });
  });

  describe('/users (GET)', () => {
    let cookieHeader: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          ...testUsers.getCredentials(Role.Admin),
        });
      cookieHeader = response.headers['set-cookie'];
    });

    it('should return all users', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toContainEqual({
        id: expect.any(Number),
        email: testUsers.getCredentials(Role.Admin).email,
        role: Role.Admin,
        registered: expect.any(String),
        firstName: null,
        lastName: null,
      });
    });
  });

  describe('/users/:id (GET)', () => {
    let cookieHeader: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          ...testUsers.getCredentials(Role.Admin),
        });
      cookieHeader = response.headers['set-cookie'];
    });

    it('should return user by id', async () => {
      const { id } = (
        await request(app.getHttpServer())
          .get('/users/me')
          .set('Cookie', cookieHeader)
      ).body;
      const response = await request(app.getHttpServer())
        .get('/users/' + id)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: id,
        email: testUsers.getCredentials(Role.Admin).email,
        role: Role.Admin,
        registered: expect.any(String),
        firstName: null,
        lastName: null,
      });
    });

    it('should return 404 if user is not found', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/' + 12345)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        message: ['user with id=12345 not found'],
        error: 'Not Found',
      });
    });
  });

  describe('/users/:id (PATCH)', () => {
    let cookieHeader: string;
    let id: number;

    beforeAll(async () => {
      const registerData = generate(RegisterDto);
      id = (
        await request(app.getHttpServer())
          .post('/auth/register')
          .send(registerData)
      ).body.id;
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          ...testUsers.getCredentials(Role.Admin),
        });
      cookieHeader = response.headers['set-cookie'];
    });

    it('should update user by id', async () => {
      const updateData = generate(UserUpdateDto, true);
      const response = await request(app.getHttpServer())
        .patch('/users/' + id)
        .set('Cookie', cookieHeader)
        .send(updateData);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: id,
        registered: expect.any(String),
        ...updateData,
      });
    });

    it('should return error if data is invalid', async () => {
      const response = await request(app.getHttpServer())
        .patch('/users/' + id)
        .set('Cookie', cookieHeader)
        .send({
          email: 'test',
        });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        statusCode: 400,
        message: ['email must be an email'],
        error: 'Bad Request',
      });
    });

    it('should return 404 if user is not found', async () => {
      const response = await request(app.getHttpServer())
        .patch('/users/' + 12345)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        message: ['user with id=12345 not found'],
        error: 'Not Found',
      });
    });
  });

  describe('/users/:id (DELETE)', () => {
    let cookieHeader: string;
    let id: number;

    beforeAll(async () => {
      const registerData = generate(RegisterDto);
      id = (
        await request(app.getHttpServer())
          .post('/auth/register')
          .send(registerData)
      ).body.id;
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          ...testUsers.getCredentials(Role.Admin),
        });
      cookieHeader = response.headers['set-cookie'];
    });

    it('should delete user by id', async () => {
      const response = await request(app.getHttpServer())
        .delete('/users/' + id)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({});
      const response2 = await request(app.getHttpServer())
        .get('/users' + id)
        .set('Cookie', cookieHeader);
      expect(response2.status).toBe(404);
    });

    it('should return 404 if user is not found', async () => {
      const response = await request(app.getHttpServer())
        .delete('/users/' + 12345)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        message: ['user with id=12345 not found'],
        error: 'Not Found',
      });
    });
  });

  describe(
    'RBAC for /users',
    setupRbacTests(
      () => app,
      () => testUsers,
      [
        // [
        //   '/users/me (GET)',
        //   [Role.Customer, Role.Manager, Role.Sales, Role.Admin, Role.Disabled],
        // ],
        ['/users (GET)', [Role.Admin]],
        ['/users/:id (GET)', [Role.Admin]],
        ['/users/:id (PATCH)', [Role.Admin]],
        ['/users/:id (DELETE)', [Role.Admin]],
      ],
    ),
  );
});
