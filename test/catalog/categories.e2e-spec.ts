import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { Role } from '../../src/users/models/role.enum';
import { TestUsersService } from '../utils/test-users/test-users.service';
import { TestUsersModule } from '../utils/test-users/test-users.module';
import { DtoGeneratorService } from '../utils/dto-generator/dto-generator.service';
import { Category } from '../../src/catalog/categories/models/category.entity';
import { Product } from '../../src/catalog/products/models/product.entity';
import { CategoryCreateDto } from '../../src/catalog/categories/dto/category-create.dto';
import { ProductCreateDto } from '../../src/catalog/products/dto/product-create.dto';
import { CategoryUpdateDto } from '../../src/catalog/categories/dto/category-update.dto';
import { setupRbacTests } from '../utils/setup-rbac-tests';

describe('CategoriesController (e2e)', () => {
  let app: INestApplication;
  let testUsers: TestUsersService;
  let cookieHeader: string;
  let testCategory: Category;
  let testProduct: Product;
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

    const createData = generate(CategoryCreateDto);
    testCategory = (
      await request(app.getHttpServer())
        .post('/categories')
        .set('Cookie', cookieHeader)
        .send(createData)
    ).body;

    const productData = generate(ProductCreateDto);
    productData.visible = true;
    testProduct = (
      await request(app.getHttpServer())
        .post('/products')
        .set('Cookie', cookieHeader)
        .send(productData)
    ).body;

    await request(app.getHttpServer())
      .post('/categories/' + testCategory.id + '/products/')
      .set('Cookie', cookieHeader)
      .send({ productId: testProduct.id });
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
        ...testCategory,
        parentCategory: null,
        groups: [],
      });
    });
  });

  describe('/categories/groups (GET)', () => {
    it('should return all category groups', async () => {
      const response = await request(app.getHttpServer())
        .get('/categories/groups')
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('/categories/:id (GET)', () => {
    it('should return category with given id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/categories/${testCategory.id}`)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ...testCategory,
        childCategories: [],
        parentCategory: null,
        groups: [],
      });
    });

    it('should return error if category with given id does not exist', async () => {
      const response = await request(app.getHttpServer())
        .get('/categories/12345')
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: ['category with id=12345 not found'],
        statusCode: 404,
        error: 'Not Found',
      });
    });
  });

  describe('/categories (POST)', () => {
    it('should create new category', async () => {
      const createData = generate(CategoryCreateDto);
      const response = await request(app.getHttpServer())
        .post('/categories')
        .set('Cookie', cookieHeader)
        .send(createData);
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        id: expect.any(Number),
        ...createData,
        slug: null,
      });
    });

    it('should create new category with parent', async () => {
      const createData = generate(CategoryCreateDto);
      createData.parentCategoryId = testCategory.id;
      const response = await request(app.getHttpServer())
        .post('/categories')
        .set('Cookie', cookieHeader)
        .send(createData);
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        id: expect.any(Number),
        ...createData,
        slug: null,
        parentCategory: { ...testCategory, groups: [], parentCategory: null },
      });
    });

    it('should return error if parent category does not exist', async () => {
      const createData = generate(CategoryCreateDto);
      createData.parentCategoryId = 12345;
      const response = await request(app.getHttpServer())
        .post('/categories')
        .set('Cookie', cookieHeader)
        .send(createData);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: ['category with id=12345 not found'],
        statusCode: 404,
        error: 'Not Found',
      });
    });

    it('should return error if data is invalid', async () => {
      const createData = generate(CategoryCreateDto);
      const response = await request(app.getHttpServer())
        .post('/categories')
        .set('Cookie', cookieHeader)
        .send({
          ...createData,
          name: '',
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
      const createData = generate(CategoryCreateDto);
      const id = (
        await request(app.getHttpServer())
          .post('/categories')
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body.id;
      const updateData = generate(CategoryUpdateDto, true);
      updateData.groups = [
        {
          name: 'test group',
        },
      ];
      const response = await request(app.getHttpServer())
        .patch('/categories/' + id)
        .set('Cookie', cookieHeader)
        .send(updateData);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id,
        ...updateData,
        parentCategory: null,
        groups: [{ name: 'test group', id: expect.any(Number) }],
      });
    });

    it('should update category parent', async () => {
      const createData = generate(CategoryCreateDto);
      const id = (
        await request(app.getHttpServer())
          .post('/categories')
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body.id;
      const updateData = generate(CategoryUpdateDto, true);
      updateData.parentCategoryId = testCategory.id;
      const response = await request(app.getHttpServer())
        .patch('/categories/' + id)
        .set('Cookie', cookieHeader)
        .send(updateData);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id,
        ...updateData,
        groups: [],
        parentCategory: { ...testCategory, groups: [], parentCategory: null },
      });
    });

    it('should return error if parent category does not exist', async () => {
      const createData = generate(CategoryCreateDto);
      const id = (
        await request(app.getHttpServer())
          .post('/categories')
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body.id;
      const updateData = generate(CategoryUpdateDto, true);
      updateData.parentCategoryId = 12345;
      const response = await request(app.getHttpServer())
        .patch('/categories/' + id)
        .set('Cookie', cookieHeader)
        .send(updateData);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: ['category with id=12345 not found'],
        statusCode: 404,
        error: 'Not Found',
      });
    });

    it('should return error if category with given id does not exist', async () => {
      const updateData = generate(CategoryUpdateDto, true);
      const response = await request(app.getHttpServer())
        .patch('/categories/12345')
        .set('Cookie', cookieHeader)
        .send(updateData);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: ['category with id=12345 not found'],
        statusCode: 404,
        error: 'Not Found',
      });
    });

    it('should return error if data is invalid', async () => {
      const updateData = generate(CategoryUpdateDto, true);
      const response = await request(app.getHttpServer())
        .patch(`/categories/${testCategory.id}`)
        .set('Cookie', cookieHeader)
        .send({
          ...updateData,
          name: '',
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
      const createData = generate(CategoryCreateDto);
      const id = (
        await request(app.getHttpServer())
          .post('/categories')
          .set('Cookie', cookieHeader)
          .send(createData)
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
        message: ['category with id=12345 not found'],
        statusCode: 404,
        error: 'Not Found',
      });
    });
  });

  describe('/categories/:id/products (GET)', () => {
    it('should return products of category with given id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/categories/${testCategory.id}/products`)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(200);
      expect(response.body).toContainEqual({
        ...testProduct,
        attributes: [],
        photos: [],
      });
    });

    it('should return error if category with given id does not exist', async () => {
      const response = await request(app.getHttpServer())
        .get('/categories/12345/products')
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: ['category with id=12345 not found'],
        statusCode: 404,
        error: 'Not Found',
      });
    });
  });

  describe('/categories/:id/products (POST)', () => {
    it('should add product to category with given id', async () => {
      const createData = generate(ProductCreateDto);
      const categoryId = (
        await request(app.getHttpServer())
          .post('/categories')
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body.id;
      const response = await request(app.getHttpServer())
        .post(`/categories/${categoryId}/products`)
        .set('Cookie', cookieHeader)
        .send({
          productId: testProduct.id,
        });
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        ...testProduct,
        attributes: [],
        photos: [],
      });
    });

    it('should return error if category with given id does not exist', async () => {
      const response = await request(app.getHttpServer())
        .post('/categories/12345/products')
        .set('Cookie', cookieHeader)
        .send({
          productId: testProduct.id,
        });
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: ['category with id=12345 not found'],
        statusCode: 404,
        error: 'Not Found',
      });
    });
  });

  describe('/categories/:id/products/:productId (DELETE)', () => {
    it('should delete product from category with given id', async () => {
      const createData = generate(ProductCreateDto);
      const categoryId = (
        await request(app.getHttpServer())
          .post('/categories')
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body.id;
      await request(app.getHttpServer())
        .post(`/categories/${categoryId}/products`)
        .set('Cookie', cookieHeader)
        .send({
          productId: testProduct.id,
        });
      const response = await request(app.getHttpServer())
        .delete(`/categories/${categoryId}/products/${testProduct.id}`)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({});
    });

    it('should return error if product with given id does not exist', async () => {
      const createData = generate(ProductCreateDto);
      const categoryId = (
        await request(app.getHttpServer())
          .post('/categories')
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body.id;
      const response = await request(app.getHttpServer())
        .delete(`/categories/${categoryId}/products/${12345}`)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: ['product with id=12345 not found'],
        statusCode: 404,
        error: 'Not Found',
      });
    });

    it('should return error if product is not in category', async () => {
      const createData = generate(ProductCreateDto);
      const categoryId = (
        await request(app.getHttpServer())
          .post('/categories')
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body.id;
      const response = await request(app.getHttpServer())
        .delete(`/categories/${categoryId}/products/${testProduct.id}`)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: ['there is no relation between category and product'],
        statusCode: 400,
        error: 'Bad Request',
      });
    });

    it('should return error if category with given id does not exist', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/categories/12345/products/${testProduct.id}`)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: ['category with id=12345 not found'],
        statusCode: 404,
        error: 'Not Found',
      });
    });
  });

  describe(
    'RBAC for /categories',
    setupRbacTests(
      () => app,
      () => testUsers,
      [
        [
          '/categories (GET)',
          [Role.Admin, Role.Manager, Role.Sales, Role.Customer, Role.Disabled],
        ],
        [
          '/categories/groups (GET)',
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
      ],
    ),
  );
});
