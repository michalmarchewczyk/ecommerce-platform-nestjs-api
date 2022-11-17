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
import { ProductRatingDto } from '../src/products/dto/product-rating.dto';
import { ProductRating } from '../src/products/entities/product-rating.entity';

describe('ProductRatingsController (e2e)', () => {
  let app: INestApplication;
  let testUsers: TestUsersService;
  let cookieHeader: string;
  let testProduct: Product;
  let testRating: ProductRating;
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

    const createData = generate(ProductRatingDto, true);
    createData.rating = 5;
    testRating = (
      await request(app.getHttpServer())
        .post(`/product-ratings/${testProduct.id}`)
        .set('Cookie', cookieHeader)
        .send(createData)
    ).body;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/product-ratings/:productId (GET)', () => {
    it('should return product ratings', async () => {
      const response = await request(app.getHttpServer())
        .get(`/product-ratings/${testProduct.id}`)
        .set('Cookie', cookieHeader);
      const { product, user, ...expected } = testRating;
      expect(response.body).toContainEqual({ ...expected, photos: [] });
    });

    it('should return empty array if product not found', async () => {
      const response = await request(app.getHttpServer())
        .get(`/product-ratings/${12345}`)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('/product-ratings/:productId (POST)', () => {
    it('should create product rating', async () => {
      const createData = generate(ProductRatingDto, true);
      createData.rating = 5;
      const response = await request(app.getHttpServer())
        .post(`/product-ratings/${testProduct.id}`)
        .set('Cookie', cookieHeader)
        .send(createData);
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        ...createData,
        product: testProduct,
      });
    });

    it('should return error if product not found', async () => {
      const createData = generate(ProductRatingDto, true);
      createData.rating = 5;
      const response = await request(app.getHttpServer())
        .post(`/product-ratings/${12345}`)
        .set('Cookie', cookieHeader)
        .send(createData);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        error: 'Not Found',
        message: ['product with id=12345 not found'],
      });
    });
  });

  describe('/product-ratings/:productId/:id (PUT)', () => {
    it('should update product rating', async () => {
      const createData = generate(ProductRatingDto, true);
      createData.rating = 5;
      const id = (
        await request(app.getHttpServer())
          .post(`/product-ratings/${testProduct.id}`)
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body.id;
      const updateData = generate(ProductRatingDto, true);
      updateData.rating = 4;
      const response = await request(app.getHttpServer())
        .put(`/product-ratings/${testProduct.id}/${id}`)
        .set('Cookie', cookieHeader)
        .send(updateData);
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        ...updateData,
      });
    });

    it('should return error if user is not an author of rating', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          ...testUsers.getCredentials(Role.Customer),
        });
      const cookieHeader = response.headers['set-cookie'];
      const updateData = generate(ProductRatingDto, true);
      updateData.rating = 4;
      const response2 = await request(app.getHttpServer())
        .put(`/product-ratings/${testProduct.id}/${testRating.id}`)
        .set('Cookie', cookieHeader)
        .send(updateData);
      expect(response2.status).toBe(403);
      expect(response2.body).toEqual({
        statusCode: 403,
        error: 'Forbidden',
        message: ['forbidden'],
      });
    });

    it('should return error if product not found', async () => {
      const updateData = generate(ProductRatingDto);
      updateData.rating = 4;
      const response = await request(app.getHttpServer())
        .put(`/product-ratings/${12345}/${testRating.id}`)
        .set('Cookie', cookieHeader)
        .send(updateData);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        error: 'Not Found',
        message: ['product rating not found'],
      });
    });

    it('should return error if product rating not found', async () => {
      const updateData = generate(ProductRatingDto);
      updateData.rating = 4;
      const response = await request(app.getHttpServer())
        .put(`/product-ratings/${testProduct.id}/${12345}`)
        .set('Cookie', cookieHeader)
        .send(updateData);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        error: 'Not Found',
        message: ['product rating not found'],
      });
    });
  });

  describe('/product-ratings/:productId/:id (DELETE)', () => {
    it('should delete product rating', async () => {
      const createData = generate(ProductRatingDto, true);
      createData.rating = 5;
      const id = (
        await request(app.getHttpServer())
          .post(`/product-ratings/${testProduct.id}`)
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body.id;
      const response = await request(app.getHttpServer())
        .delete(`/product-ratings/${testProduct.id}/${id}`)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(200);
    });

    it('should return error if product not found', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/product-ratings/${12345}/${testRating.id}`)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        error: 'Not Found',
        message: ['product rating not found'],
      });
    });

    it('should return error if product rating not found', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/product-ratings/${testProduct.id}/${12345}`)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        error: 'Not Found',
        message: ['product rating not found'],
      });
    });
  });

  describe(
    'RBAC for /product-ratings',
    setupRbacTests(
      () => app,
      () => testUsers,
      [
        [
          '/product-ratings/:productId (GET)',
          [Role.Admin, Role.Manager, Role.Sales, Role.Customer, Role.Disabled],
        ],
        [
          '/product-ratings/:productId (POST)',
          [Role.Admin, Role.Manager, Role.Sales, Role.Customer],
        ],
        [
          '/product-ratings/:productId/:id (PUT)',
          [Role.Admin, Role.Manager, Role.Sales, Role.Customer],
        ],
        [
          '/product-ratings/:productId/:id (DELETE)',
          [Role.Admin, Role.Manager, Role.Sales],
        ],
      ],
    ),
  );
});
