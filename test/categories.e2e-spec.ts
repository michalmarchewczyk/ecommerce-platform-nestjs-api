import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Role } from '../src/users/entities/role.enum';
import { TestUsersService } from './utils/test-users.service';
import { TestUsersModule } from './utils/test-users.module';
import { parseEndpoint } from './utils/parse-endpoint';

describe('CategoriesController (e2e)', () => {
  let app: INestApplication;
  let testUsers: TestUsersService;
  let cookieHeader: string;
  let testCategoryId: number;
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

    testCategoryId = (
      await request(app.getHttpServer())
        .post('/categories')
        .set('Cookie', cookieHeader)
        .send({
          name: 'Test category',
          description: 'Test category description',
        })
    ).body.id;

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

    await request(app.getHttpServer())
      .post('/categories/' + testCategoryId + '/products/')
      .set('Cookie', cookieHeader)
      .send({ productId: testProductId });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/categories (GET)', () => {
    it('should return all categories', async () => {
      const response = await request(app.getHttpServer())
        .get('/categories')
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(200);
      expect(response.body).toContainEqual({
        id: testCategoryId,
        name: 'Test category',
        description: 'Test category description',
        slug: null,
      });
    });
  });

  describe('/categories/:id (GET)', () => {
    it('should return category with given id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/categories/${testCategoryId}`)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: testCategoryId,
        name: 'Test category',
        description: 'Test category description',
        slug: null,
        childCategories: [],
      });
    });

    it('should return error if category with given id does not exist', async () => {
      const response = await request(app.getHttpServer())
        .get('/categories/12345')
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: ['category not found'],
        statusCode: 404,
        error: 'Not Found',
      });
    });
  });

  describe('/categories (POST)', () => {
    it('should create new category', async () => {
      const response = await request(app.getHttpServer())
        .post('/categories')
        .set('Cookie', cookieHeader)
        .send({
          name: 'Test category 2',
          description: 'Test category description 2',
        });
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        id: expect.any(Number),
        name: 'Test category 2',
        description: 'Test category description 2',
        slug: null,
      });
    });

    it('should return error if data is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/categories')
        .set('Cookie', cookieHeader)
        .send({
          name: '',
          description: 'Test category description 2',
        });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: ['name should not be empty'],
        statusCode: 400,
        error: 'Bad Request',
      });
    });
  });

  describe('/categories/:id (PATCH)', () => {
    it('should update category with given id', async () => {
      const id = (
        await request(app.getHttpServer())
          .post('/categories')
          .set('Cookie', cookieHeader)
          .send({
            name: 'Test category 3',
            description: 'Test category description 3',
          })
      ).body.id;
      const response = await request(app.getHttpServer())
        .patch('/categories/' + id)
        .set('Cookie', cookieHeader)
        .send({
          name: 'Test category 3 updated',
          description: 'Test category description 3 updated',
          slug: 'test-category-3-updated',
        });
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: id,
        name: 'Test category 3 updated',
        description: 'Test category description 3 updated',
        slug: 'test-category-3-updated',
      });
    });

    it('should return error if category with given id does not exist', async () => {
      const response = await request(app.getHttpServer())
        .patch('/categories/12345')
        .set('Cookie', cookieHeader)
        .send({
          name: 'Test category 3 updated',
          description: 'Test category description 3 updated',
        });
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: ['category not found'],
        statusCode: 404,
        error: 'Not Found',
      });
    });

    it('should return error if data is invalid', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/categories/${testCategoryId}`)
        .set('Cookie', cookieHeader)
        .send({
          name: '',
          description: 'Test category description 3 updated',
        });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: ['name should not be empty'],
        statusCode: 400,
        error: 'Bad Request',
      });
    });
  });

  describe('/categories/:id (DELETE)', () => {
    it('should delete category with given id', async () => {
      const id = (
        await request(app.getHttpServer())
          .post('/categories')
          .set('Cookie', cookieHeader)
          .send({
            name: 'Test category 4',
            description: 'Test category description 4',
          })
      ).body.id;
      const response = await request(app.getHttpServer())
        .delete('/categories/' + id)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({});
    });

    it('should return error if category with given id does not exist', async () => {
      const response = await request(app.getHttpServer())
        .delete('/categories/12345')
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: ['category not found'],
        statusCode: 404,
        error: 'Not Found',
      });
    });
  });

  describe('/categories/:id/products (GET)', () => {
    it('should return products of category with given id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/categories/${testCategoryId}/products`)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(200);
      expect(response.body).toContainEqual({
        id: testProductId,
        name: 'Test product',
        description: 'Test description',
        price: 100,
        stock: 100,
        visible: true,
        attributes: [],
        photos: [],
        created: expect.any(String),
        updated: expect.any(String),
      });
    });

    it('should return error if category with given id does not exist', async () => {
      const response = await request(app.getHttpServer())
        .get('/categories/12345/products')
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: ['category not found'],
        statusCode: 404,
        error: 'Not Found',
      });
    });
  });

  describe('/categories/:id/products (POST)', () => {
    it('should add product to category with given id', async () => {
      const categoryId = (
        await request(app.getHttpServer())
          .post('/categories')
          .set('Cookie', cookieHeader)
          .send({
            name: 'Test category 5',
            description: 'Test category description 5',
          })
      ).body.id;
      const response = await request(app.getHttpServer())
        .post(`/categories/${categoryId}/products`)
        .set('Cookie', cookieHeader)
        .send({
          productId: testProductId,
        });
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        id: testProductId,
        name: 'Test product',
        description: 'Test description',
        price: 100,
        stock: 100,
        visible: true,
        attributes: [],
        photos: [],
        created: expect.any(String),
        updated: expect.any(String),
      });
    });

    it('should return error if category with given id does not exist', async () => {
      const response = await request(app.getHttpServer())
        .post('/categories/12345/products')
        .set('Cookie', cookieHeader)
        .send({
          productId: testProductId,
        });
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: ['category or product not found'],
        statusCode: 404,
        error: 'Not Found',
      });
    });
  });

  describe('/categories/:id/products/:productId (DELETE)', () => {
    it('should delete product from category with given id', async () => {
      const categoryId = (
        await request(app.getHttpServer())
          .post('/categories')
          .set('Cookie', cookieHeader)
          .send({
            name: 'Test category 5',
            description: 'Test category description 5',
          })
      ).body.id;
      await request(app.getHttpServer())
        .post(`/categories/${categoryId}/products`)
        .set('Cookie', cookieHeader)
        .send({
          productId: testProductId,
        });
      const response = await request(app.getHttpServer())
        .delete(`/categories/${categoryId}/products/${testProductId}`)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({});
    });

    it('should return error if category with given id does not exist', async () => {
      const response = await request(app.getHttpServer())
        .delete('/categories/12345/products/12345')
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: ['category or product not found'],
        statusCode: 404,
        error: 'Not Found',
      });
    });
  });

  describe('RBAC for /categories', () => {
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
        '/categories (GET)',
        [Role.Admin, Role.Manager, Role.Sales, Role.Customer, Role.Disabled],
      ],
      ['/categories (POST)', [Role.Admin, Role.Manager]],
      [
        '/categories/:id (GET)',
        [Role.Admin, Role.Manager, Role.Sales, Role.Customer, Role.Disabled],
      ],
      ['/categories/:id (PATCH)', [Role.Admin, Role.Manager]],
      ['/categories/:id (DELETE)', [Role.Admin, Role.Manager]],
      [
        '/categories/:id/products (GET)',
        [Role.Admin, Role.Manager, Role.Sales, Role.Customer, Role.Disabled],
      ],
      ['/categories/:id/products (POST)', [Role.Admin, Role.Manager]],
      [
        '/categories/:id/products/:productId (DELETE)',
        [Role.Admin, Role.Manager],
      ],
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
