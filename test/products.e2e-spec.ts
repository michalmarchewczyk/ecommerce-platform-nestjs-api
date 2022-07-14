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
  let testProductId: number;

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

    testProductId = (
      await request(app.getHttpServer())
        .post('/products')
        .set('Cookie', cookieHeader)
        .send({
          name: 'Test product',
          price: 100,
          description: 'Test description',
          stock: 100,
        })
    ).body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/products (GET)', () => {
    it('should return all products', async () => {
      const response = await request(app.getHttpServer())
        .get('/products')
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(200);
      expect(response.body).toContainEqual({
        id: testProductId,
        name: 'Test product',
        price: 100,
        description: 'Test description',
        stock: 100,
        visible: true,
        created: expect.any(String),
        updated: expect.any(String),
        attributes: [],
        photos: [],
      });
    });
  });

  describe('/products/:id (GET)', () => {
    it('should return product by id', async () => {
      const response = await request(app.getHttpServer())
        .get('/products/' + testProductId)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: testProductId,
        name: 'Test product',
        price: 100,
        description: 'Test description',
        stock: 100,
        visible: true,
        created: expect.any(String),
        updated: expect.any(String),
        attributes: [],
        photos: [],
      });
    });

    it('should return error if product not found', async () => {
      const response = await request(app.getHttpServer())
        .get('/products/12345')
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        message: ['product not found'],
        error: 'Not Found',
      });
    });
  });

  describe('/products (POST)', () => {
    it('should create product', async () => {
      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Cookie', cookieHeader)
        .send({
          name: 'Test product 2',
          price: 200,
          description: 'Test description 2',
          stock: 200,
        });
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        id: expect.any(Number),
        name: 'Test product 2',
        price: 200,
        description: 'Test description 2',
        stock: 200,
        visible: true,
        created: expect.any(String),
        updated: expect.any(String),
      });
    });

    it('should return error when data is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Cookie', cookieHeader)
        .send({
          name: '',
          price: '200',
          description: 'Test description 2',
          stock: '200',
        });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        statusCode: 400,
        message: [
          'name should not be empty',
          'price must not be less than 0',
          'price must be a number conforming to the specified constraints',
          'stock must not be less than 0',
          'stock must be a number conforming to the specified constraints',
        ],
        error: 'Bad Request',
      });
    });
  });

  describe('/products/:id (PATCH)', () => {
    it('should update product', async () => {
      const id = (
        await request(app.getHttpServer())
          .post('/products')
          .set('Cookie', cookieHeader)
          .send({
            name: 'Test product 3',
            price: 300,
            description: 'Test description 3',
            stock: 300,
          })
      ).body.id;
      const response = await request(app.getHttpServer())
        .patch('/products/' + id)
        .set('Cookie', cookieHeader)
        .send({
          name: 'Test product 3 updated',
          price: 3300,
          stock: 330,
          visible: false,
        });
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: expect.any(Number),
        name: 'Test product 3 updated',
        price: 3300,
        description: 'Test description 3',
        stock: 330,
        visible: false,
        created: expect.any(String),
        updated: expect.any(String),
        attributes: [],
        photos: [],
      });
      expect(response.body.created).not.toBe(response.body.updated);
    });

    it('should return error if product not found', async () => {
      const response = await request(app.getHttpServer())
        .patch('/products/12345')
        .set('Cookie', cookieHeader)
        .send({
          name: 'Test product 3 updated',
          price: 3300,
          stock: 330,
          visible: false,
        });
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        message: ['product not found'],
        error: 'Not Found',
      });
    });

    it('should return error when data is invalid', async () => {
      const id = (
        await request(app.getHttpServer())
          .post('/products')
          .set('Cookie', cookieHeader)
          .send({
            name: 'Test product 4',
            price: 400,
            description: 'Test description 4',
            stock: 400,
          })
      ).body.id;
      const response = await request(app.getHttpServer())
        .patch('/products/' + id)
        .set('Cookie', cookieHeader)
        .send({
          name: '',
          price: '200',
          stock: '200',
        });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        statusCode: 400,
        message: [
          'name should not be empty',
          'price must not be less than 0',
          'price must be a number conforming to the specified constraints',
          'stock must not be less than 0',
          'stock must be a number conforming to the specified constraints',
        ],
        error: 'Bad Request',
      });
    });
  });

  describe('/products/:id (DELETE)', () => {
    it('should delete product', async () => {
      const id = (
        await request(app.getHttpServer())
          .post('/products')
          .set('Cookie', cookieHeader)
          .send({
            name: 'Test product 5',
            price: 500,
            description: 'Test description 5',
            stock: 500,
          })
      ).body.id;
      const response = await request(app.getHttpServer())
        .delete('/products/' + id)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({});
    });

    it('should return error if product not found', async () => {
      const response = await request(app.getHttpServer())
        .delete('/products/12345')
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        message: ['product not found'],
        error: 'Not Found',
      });
    });
  });

  describe('/products/:id/attributes (PATCH)', () => {
    it('should update product attributes', async () => {
      const id = (
        await request(app.getHttpServer())
          .post('/products')
          .set('Cookie', cookieHeader)
          .send({
            name: 'Test product 6',
            price: 600,
            description: 'Test description 6',
            stock: 600,
          })
      ).body.id;
      const attrId = (
        await request(app.getHttpServer())
          .post('/attributes')
          .set('Cookie', cookieHeader)
          .send({
            name: 'Test attribute 1',
            valueType: 'string',
          })
      ).body.id;
      const response = await request(app.getHttpServer())
        .patch('/products/' + id + '/attributes')
        .set('Cookie', cookieHeader)
        .send([
          {
            value: 'Test attribute 1',
            type: { id: attrId },
          },
        ]);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: expect.any(Number),
        name: 'Test product 6',
        price: 600,
        description: 'Test description 6',
        stock: 600,
        visible: true,
        created: expect.any(String),
        updated: expect.any(String),
        attributes: [
          {
            id: expect.any(Number),
            value: 'Test attribute 1',
            type: { id: attrId },
          },
        ],
        photos: [],
      });
    });

    it('should return error if product not found', async () => {
      const response = await request(app.getHttpServer())
        .patch('/products/12345/attributes')
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        message: ['product not found'],
        error: 'Not Found',
      });
    });
  });

  describe('/products/:id/photos (POST)', () => {
    it('should add photo to product', async () => {
      const id = (
        await request(app.getHttpServer())
          .post('/products')
          .set('Cookie', cookieHeader)
          .send({
            name: 'Test product 7',
            price: 700,
            description: 'Test description 7',
            stock: 700,
          })
      ).body.id;
      const response = await request(app.getHttpServer())
        .post('/products/' + id + '/photos')
        .set('Cookie', cookieHeader)
        .attach('file', './test/assets/test.jpg');
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        id: expect.any(Number),
        name: 'Test product 7',
        price: 700,
        description: 'Test description 7',
        stock: 700,
        visible: true,
        created: expect.any(String),
        updated: expect.any(String),
        attributes: [],
        photos: [
          {
            id: expect.any(Number),
            mimeType: 'image/jpeg',
            path: expect.any(String),
          },
        ],
      });
      expect(response.body.photos[0]).toEqual({
        id: expect.any(Number),
        mimeType: 'image/jpeg',
        path: expect.any(String),
      });
    });

    it('should return error if wrong file type', async () => {
      const id = (
        await request(app.getHttpServer())
          .post('/products')
          .set('Cookie', cookieHeader)
          .send({
            name: 'Test product 8',
            price: 800,
            description: 'Test description 8',
            stock: 800,
          })
      ).body.id;
      const response = await request(app.getHttpServer())
        .post('/products/' + id + '/photos')
        .set('Cookie', cookieHeader)
        .attach('file', './test/assets/test.txt');
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        statusCode: 400,
        message:
          'Validation failed (expected type is /^image\\/(png|jpe?g|gif|webp)/)',
        error: 'Bad Request',
      });
    });

    it('should return error if product not found', async () => {
      const response = await request(app.getHttpServer())
        .post('/products/12345/photos')
        .set('Cookie', cookieHeader)
        .attach('file', './test/assets/test.jpg');
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        message: ['product not found'],
        error: 'Not Found',
      });
    });
  });

  describe('/products/:id/photos/:photoId (DELETE)', () => {
    it('should delete photo from product', async () => {
      const id = (
        await request(app.getHttpServer())
          .post('/products')
          .set('Cookie', cookieHeader)
          .send({
            name: 'Test product 8',
            price: 800,
            description: 'Test description 8',
            stock: 800,
          })
      ).body.id;
      const photoId = (
        await request(app.getHttpServer())
          .post('/products/' + id + '/photos')
          .set('Cookie', cookieHeader)
          .attach('file', './test/assets/test.jpg')
      ).body.photos[0].id;
      const response = await request(app.getHttpServer())
        .delete('/products/' + id + '/photos/' + photoId)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(200);
      expect(response.body.photos).toEqual([]);
    });

    it('should return error if product not found', async () => {
      const response = await request(app.getHttpServer())
        .delete('/products/12345/photos/12345')
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        message: ['product not found'],
        error: 'Not Found',
      });
    });
  });

  describe('RBAC for /products', () => {
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
        '/products (GET)',
        [Role.Admin, Role.Manager, Role.Sales, Role.Customer, Role.Disabled],
      ],
      [
        '/products/:id (GET)',
        [Role.Admin, Role.Manager, Role.Sales, Role.Customer, Role.Disabled],
      ],
      ['/products (POST)', [Role.Admin, Role.Manager]],
      ['/products/:id (PATCH)', [Role.Admin, Role.Manager]],
      ['/products/:id (DELETE)', [Role.Admin, Role.Manager]],
      ['/products/:id/attributes (PATCH)', [Role.Admin, Role.Manager]],
      ['/products/:id/photos (POST)', [Role.Admin, Role.Manager]],
      ['/products/:id/photos/:photoId (DELETE)', [Role.Admin, Role.Manager]],
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
