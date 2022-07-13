import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Role } from '../src/users/entities/role.enum';
import { TestUsersService } from './utils/test-users.service';
import { TestUsersModule } from './utils/test-users.module';
import { parseEndpoint } from './utils/parse-endpoint';

describe('ProductsController (e2e)', () => {
  let app: INestApplication;
  let testUsers: TestUsersService;
  let cookieHeader: string;
  let testAttributeTypeId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, TestUsersModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    testUsers = moduleFixture.get<TestUsersService>(TestUsersService);
    await app.init();
    await testUsers.init();

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        ...testUsers.getCredentials(Role.Admin),
      });
    cookieHeader = response.headers['set-cookie'];

    testAttributeTypeId = (
      await request(app.getHttpServer())
        .post('/attributes')
        .set('Cookie', cookieHeader)
        .send({
          name: 'Test attribute',
          valueType: 'string',
        })
    ).body.id;
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
      expect(response.body).toContainEqual({
        id: testAttributeTypeId,
        name: 'Test attribute',
        valueType: 'string',
      });
    });
  });

  describe('/attributes (POST)', () => {
    it('should create new attribute type', async () => {
      const response = await request(app.getHttpServer())
        .post('/attributes')
        .set('Cookie', cookieHeader)
        .send({
          name: 'Test attribute 2',
          valueType: 'number',
        });
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        id: expect.any(Number),
        name: 'Test attribute 2',
        valueType: 'number',
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
      const id = (
        await request(app.getHttpServer())
          .post('/attributes')
          .set('Cookie', cookieHeader)
          .send({
            name: 'Test attribute 4',
            valueType: 'string',
          })
      ).body.id;
      const response = await request(app.getHttpServer())
        .put(`/attributes/${id}`)
        .set('Cookie', cookieHeader)
        .send({
          name: 'Test attribute 4 updated',
          valueType: 'boolean',
        });
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: id,
        name: 'Test attribute 4 updated',
        valueType: 'boolean',
      });
    });

    it('should return error when data is invalid', async () => {
      const response = await request(app.getHttpServer())
        .put('/attributes/' + testAttributeTypeId)
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
      const response = await request(app.getHttpServer())
        .put('/attributes/12345')
        .set('Cookie', cookieHeader)
        .send({
          name: 'Test attribute 5 updated',
          valueType: 'boolean',
        });
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
      const id = (
        await request(app.getHttpServer())
          .post('/attributes')
          .set('Cookie', cookieHeader)
          .send({
            name: 'Test attribute 6',
            valueType: 'string',
          })
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

  describe('RBAC for /attributes', () => {
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
      ['/attributes (GET)', [Role.Admin, Role.Manager]],
      ['/attributes (POST)', [Role.Admin, Role.Manager]],
      ['/attributes/:id (PUT)', [Role.Admin, Role.Manager]],
      ['/attributes/:id (DELETE)', [Role.Admin, Role.Manager]],
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
