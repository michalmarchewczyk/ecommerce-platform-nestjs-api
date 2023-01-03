import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { Role } from '../../src/users/models/role.enum';
import { TestUsersService } from '../utils/test-users/test-users.service';
import { TestUsersModule } from '../utils/test-users/test-users.module';
import { DtoGeneratorService } from '../utils/dto-generator/dto-generator.service';
import { ProductCreateDto } from '../../src/catalog/products/dto/product-create.dto';
import { Product } from '../../src/catalog/products/models/product.entity';
import { setupRbacTests } from '../utils/setup-rbac-tests';
import { ProductRatingDto } from '../../src/catalog/product-ratings/dto/product-rating.dto';
import { ProductRating } from '../../src/catalog/product-ratings/models/product-rating.entity';
import { SettingsService } from '../../src/settings/settings.service';

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
    productData.visible = true;
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
        .post(`/products/${testProduct.id}/ratings`)
        .set('Cookie', cookieHeader)
        .send(createData)
    ).body;
    await request(app.getHttpServer())
      .post(`/products/${testProduct.id}/ratings/${testRating.id}/photos`)
      .set('Cookie', cookieHeader)
      .attach('file', './test/assets/test.jpg');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/products/:productId/ratings (GET)', () => {
    it('should return product ratings', async () => {
      const response = await request(app.getHttpServer())
        .get(`/products/${testProduct.id}/ratings`)
        .set('Cookie', cookieHeader);
      const { product, user, ...expected } = testRating;
      expect(response.body).toContainEqual({
        ...expected,
        photos: [expect.any(Object)],
        user: expect.any(Object),
      });
    });

    it('should return product ratings without photos', async () => {
      const settings = await app.get(SettingsService);
      const settingId = (await settings.getSettings()).find(
        (s) => s.name === 'Product rating photos',
      )?.id;
      await settings.updateSetting(settingId ?? -1, { value: 'false' });
      const response = await request(app.getHttpServer())
        .get(`/products/${testProduct.id}/ratings`)
        .set('Cookie', cookieHeader);
      const { product, user, ...expected } = testRating;
      expect(response.body).toContainEqual({
        ...expected,
        photos: [],
        user: expect.any(Object),
      });
      await settings.updateSetting(settingId ?? -1, { value: 'true' });
    });

    it('should return empty array if product not found', async () => {
      const response = await request(app.getHttpServer())
        .get(`/products/${12345}/ratings`)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return error if disabled by setting', async () => {
      const settings = await app.get(SettingsService);
      const settingId = (await settings.getSettings()).find(
        (s) => s.name === 'Product ratings',
      )?.id;
      await settings.updateSetting(settingId ?? -1, { value: 'false' });
      const response = await request(app.getHttpServer())
        .get(`/products/${testProduct.id}/ratings`)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        message: 'Not Found',
      });
      await settings.updateSetting(settingId ?? -1, { value: 'true' });
    });
  });

  describe('/products/:productId/ratings (POST)', () => {
    it('should create product rating', async () => {
      const createData = generate(ProductRatingDto, true);
      createData.rating = 5;
      const response = await request(app.getHttpServer())
        .post(`/products/${testProduct.id}/ratings`)
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
        .post(`/products/${12345}/ratings`)
        .set('Cookie', cookieHeader)
        .send(createData);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        error: 'Not Found',
        message: ['product with id=12345 not found'],
      });
    });

    it('should return error if disabled by setting', async () => {
      const settings = await app.get(SettingsService);
      const settingId = (await settings.getSettings()).find(
        (s) => s.name === 'Product ratings',
      )?.id;
      await settings.updateSetting(settingId ?? -1, { value: 'false' });
      const createData = generate(ProductRatingDto, true);
      createData.rating = 5;
      const response = await request(app.getHttpServer())
        .post(`/products/${testProduct.id}/ratings`)
        .set('Cookie', cookieHeader)
        .send(createData);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        message: 'Not Found',
      });
      await settings.updateSetting(settingId ?? -1, { value: 'true' });
    });
  });

  describe('/products/:productId/ratings/:id (PUT)', () => {
    it('should update product rating', async () => {
      const createData = generate(ProductRatingDto, true);
      createData.rating = 5;
      const id = (
        await request(app.getHttpServer())
          .post(`/products/${testProduct.id}/ratings`)
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body.id;
      const updateData = generate(ProductRatingDto, true);
      updateData.rating = 4;
      const response = await request(app.getHttpServer())
        .put(`/products/${testProduct.id}/ratings/${id}`)
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
        .put(`/products/${testProduct.id}/ratings/${testRating.id}`)
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
        .put(`/products/${12345}/ratings/${testRating.id}`)
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
        .put(`/products/${testProduct.id}/ratings/${12345}`)
        .set('Cookie', cookieHeader)
        .send(updateData);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        error: 'Not Found',
        message: ['product rating not found'],
      });
    });

    it('should return error if disabled by setting', async () => {
      const createData = generate(ProductRatingDto, true);
      createData.rating = 5;
      const id = (
        await request(app.getHttpServer())
          .post(`/products/${testProduct.id}/ratings`)
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body.id;
      const settings = await app.get(SettingsService);
      const settingId = (await settings.getSettings()).find(
        (s) => s.name === 'Product ratings',
      )?.id;
      await settings.updateSetting(settingId ?? -1, { value: 'false' });
      const updateData = generate(ProductRatingDto, true);
      updateData.rating = 4;
      const response = await request(app.getHttpServer())
        .put(`/products/${testProduct.id}/ratings/${id}`)
        .set('Cookie', cookieHeader)
        .send(updateData);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        message: 'Not Found',
      });
      await settings.updateSetting(settingId ?? -1, { value: 'true' });
    });
  });

  describe('/products/:productId/ratings/:id (DELETE)', () => {
    it('should delete product rating', async () => {
      const createData = generate(ProductRatingDto, true);
      createData.rating = 5;
      const id = (
        await request(app.getHttpServer())
          .post(`/products/${testProduct.id}/ratings`)
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body.id;
      const response = await request(app.getHttpServer())
        .delete(`/products/${testProduct.id}/ratings/${id}`)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(200);
    });

    it('should return error if product not found', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/products/${12345}/ratings/${testRating.id}`)
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
        .delete(`/products/${testProduct.id}/ratings/${12345}`)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        error: 'Not Found',
        message: ['product rating not found'],
      });
    });

    it('should return error if disabled by setting', async () => {
      const createData = generate(ProductRatingDto, true);
      createData.rating = 5;
      const id = (
        await request(app.getHttpServer())
          .post(`/products/${testProduct.id}/ratings`)
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body.id;
      const settings = await app.get(SettingsService);
      const settingId = (await settings.getSettings()).find(
        (s) => s.name === 'Product ratings',
      )?.id;
      await settings.updateSetting(settingId ?? -1, { value: 'false' });
      const response = await request(app.getHttpServer())
        .delete(`/products/${testProduct.id}/ratings/${id}`)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        message: 'Not Found',
      });
      await settings.updateSetting(settingId ?? -1, { value: 'true' });
    });
  });

  describe(
    'RBAC for /products/:productId/ratings',
    setupRbacTests(
      () => app,
      () => testUsers,
      [
        [
          '/products/:productId/ratings (GET)',
          [Role.Admin, Role.Manager, Role.Sales, Role.Customer, Role.Disabled],
        ],
        [
          '/products/:productId/ratings (POST)',
          [Role.Admin, Role.Manager, Role.Sales, Role.Customer],
        ],
        [
          '/products/:productId/ratings/:id (PUT)',
          [Role.Admin, Role.Manager, Role.Sales, Role.Customer],
        ],
        [
          '/products/:productId/ratings/:id (DELETE)',
          [Role.Admin, Role.Manager, Role.Sales],
        ],
      ],
    ),
  );
});
