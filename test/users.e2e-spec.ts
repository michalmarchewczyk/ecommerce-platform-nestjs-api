import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Role } from '../src/users/entities/role.enum';
import { TestUsersService } from './utils/test-users.service';
import { TestUsersModule } from './utils/test-users.module';
import { parseEndpoint } from './utils/parse-endpoint';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let testUsers: TestUsersService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, TestUsersModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    testUsers = moduleFixture.get<TestUsersService>(TestUsersService);
    await app.init();
    await testUsers.init();
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
        message: ['user not found'],
        error: 'Not Found',
      });
    });
  });

  describe('/users/:id (PATCH)', () => {
    let cookieHeader: string;
    let id: number;

    beforeAll(async () => {
      id = (
        await request(app.getHttpServer()).post('/auth/register').send({
          email: 'testuser@test.local',
          password: 'test1234',
        })
      ).body.id;
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          ...testUsers.getCredentials(Role.Admin),
        });
      cookieHeader = response.headers['set-cookie'];
    });

    it('should update user by id', async () => {
      const response = await request(app.getHttpServer())
        .patch('/users/' + id)
        .set('Cookie', cookieHeader)
        .send({
          email: 'testuserupdated@test.local',
          role: Role.Manager,
          firstName: 'Test',
          lastName: 'User',
        });
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: id,
        email: 'testuserupdated@test.local',
        role: Role.Manager,
        registered: expect.any(String),
        firstName: 'Test',
        lastName: 'User',
      });
    });

    it('should return error if data is invalid', async () => {
      const response = await request(app.getHttpServer())
        .patch('/users/' + id)
        .set('Cookie', cookieHeader)
        .send({
          email: 'testuser',
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
        message: ['user not found'],
        error: 'Not Found',
      });
    });
  });

  describe('/users/:id (DELETE)', () => {
    let cookieHeader: string;
    let id: number;

    beforeAll(async () => {
      id = (
        await request(app.getHttpServer()).post('/auth/register').send({
          email: 'testuser2@test.local',
          password: 'test1234',
        })
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
        message: ['user not found'],
        error: 'Not Found',
      });
    });
  });

  describe('RBAC for /users', () => {
    const cookieHeaders = {};
    const availableRoles = Object.values(Role);

    beforeAll(async () => {
      for (const role of availableRoles) {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ ...testUsers.getCredentials(role) });
        cookieHeaders[role] = response.headers['set-cookie'];
      }
    });

    describe.each([
      [
        '/users/me (GET)',
        [Role.Customer, Role.Manager, Role.Sales, Role.Admin, Role.Disabled],
      ],
      ['/users (GET)', [Role.Admin]],
      ['/users/:id (GET)', [Role.Admin]],
      ['/users/:id (PATCH)', [Role.Admin]],
      ['/users/:id (DELETE)', [Role.Admin]],
    ])('%s', (endpoint, roles) => {
      const [url, method] = parseEndpoint(endpoint);

      const testRoles: [Role, boolean][] = availableRoles.map((role) => [
        role,
        roles.includes(role),
      ]);

      it.each(testRoles)(
        `${endpoint} can be accessed by %s: %p`,
        async (role, result) => {
          const response = await request(app.getHttpServer())
            [method](url)
            .set('Cookie', cookieHeaders[role]);
          if (result) {
            expect(response.status).not.toBe(403);
          } else {
            expect(response.status).toBe(403);
          }
        },
      );
    });
  });
});
