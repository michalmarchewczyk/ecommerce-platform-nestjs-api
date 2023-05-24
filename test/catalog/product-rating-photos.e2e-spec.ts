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

describe('ProductRatingPhotosController (e2e)', () => {
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

  describe('/products/:productId/ratings/:id/photos/:photoId (GET)', () => {
    it('should be able to get product rating photos', async () => {
      const createData = generate(ProductRatingDto, true);
      createData.rating = 5;
      const id = (
        await request(app.getHttpServer())
          .post(`/products/${testProduct.id}/ratings`)
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body.id;
      const response = await request(app.getHttpServer())
        .post(`/products/${testProduct.id}/ratings/${id}/photos`)
        .set('Cookie', cookieHeader)
        .attach('file', './test/assets/test.jpg');
      const response2 = await request(app.getHttpServer()).get(
        `/products/${testProduct.id}/ratings/${id}/photos/${response.body.photos[0].id}`,
      );
      expect(response2.status).toBe(200);
      expect(response2.header['content-type']).toBe('image/jpeg');
    });

    it('should be able to get product rating photos thumbnails', async () => {
      const createData = generate(ProductRatingDto, true);
      createData.rating = 5;
      const id = (
        await request(app.getHttpServer())
          .post(`/products/${testProduct.id}/ratings`)
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body.id;
      const response = await request(app.getHttpServer())
        .post(`/products/${testProduct.id}/ratings/${id}/photos`)
        .set('Cookie', cookieHeader)
        .attach('file', './test/assets/test.jpg');
      const response2 = await request(app.getHttpServer()).get(
        `/products/${testProduct.id}/ratings/${id}/photos/${response.body.photos[0].id}?thumbnail=true`,
      );
      expect(response2.status).toBe(200);
      expect(response2.header['content-type']).toBe('image/jpeg');
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
      const response = await request(app.getHttpServer())
        .post(`/products/${testProduct.id}/ratings/${id}/photos`)
        .set('Cookie', cookieHeader)
        .attach('file', './test/assets/test.jpg');
      const settings = await app.get(SettingsService);
      const settingId = (await settings.getSettings()).find(
        (s) => s.name === 'Product rating photos',
      )?.id;
      await settings.updateSetting(settingId ?? -1, { value: 'false' });
      const response2 = await request(app.getHttpServer()).get(
        `/products/${testProduct.id}/ratings/${id}/photos/${response.body.photos[0].id}`,
      );
      expect(response2.status).toBe(404);
      expect(response2.body).toEqual({
        statusCode: 404,
        message: 'Not Found',
      });
      await settings.updateSetting(settingId ?? -1, { value: 'true' });
    });

    it('should return error if product not found', async () => {
      const response = await request(app.getHttpServer())
        .get(`/products/${12345}/ratings/${testRating.id}/photos/${12345}`)
        .set('Cookie', cookieHeader)
        .send();
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        error: 'Not Found',
        message: ['product rating photo with id=12345 not found'],
      });
    });

    it('should return error if product rating not found', async () => {
      const response = await request(app.getHttpServer())
        .get(`/products/${testProduct.id}/ratings/${12345}/photos/${12345}`)
        .set('Cookie', cookieHeader)
        .send();
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        error: 'Not Found',
        message: ['product rating photo with id=12345 not found'],
      });
    });

    it('should return error if product rating photo not found', async () => {
      const response = await request(app.getHttpServer())
        .get(
          `/products/${testProduct.id}/ratings/${
            testRating.id
          }/photos/${12345}`,
        )
        .set('Cookie', cookieHeader)
        .send();
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        error: 'Not Found',
        message: ['product rating photo with id=12345 not found'],
      });
    });
  });

  describe('/products/:productId/ratings/:id/photos (POST)', () => {
    it('should add photo to product rating', async () => {
      const createData = generate(ProductRatingDto, true);
      createData.rating = 5;
      const id = (
        await request(app.getHttpServer())
          .post(`/products/${testProduct.id}/ratings`)
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body.id;
      const response = await request(app.getHttpServer())
        .post(`/products/${testProduct.id}/ratings/${id}/photos`)
        .set('Cookie', cookieHeader)
        .attach('file', './test/assets/test.jpg');
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        id: expect.any(Number),
        ...createData,
        created: expect.any(String),
        updated: expect.any(String),
        photos: [
          {
            id: expect.any(Number),
            mimeType: 'image/jpeg',
            path: expect.any(String),
            thumbnailPath: expect.any(String),
            placeholderBase64: expect.any(String),
          },
        ],
      });
      expect(response.body.photos[0]).toEqual({
        id: expect.any(Number),
        mimeType: 'image/jpeg',
        path: expect.any(String),
        thumbnailPath: expect.any(String),
        placeholderBase64: expect.any(String),
      });
    });

    it('should return error if wrong file type', async () => {
      const createData = generate(ProductRatingDto, true);
      createData.rating = 5;
      const id = (
        await request(app.getHttpServer())
          .post(`/products/${testProduct.id}/ratings`)
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body.id;
      const response = await request(app.getHttpServer())
        .post(`/products/${testProduct.id}/ratings/${id}/photos`)
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

    it('should return error if user is not an author of rating', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          ...testUsers.getCredentials(Role.Customer),
        });
      const cookieHeader = response.headers['set-cookie'];
      const response2 = await request(app.getHttpServer())
        .post(`/products/${testProduct.id}/ratings/${testRating.id}/photos`)
        .set('Cookie', cookieHeader)
        .attach('file', './test/assets/test.jpg');
      expect(response2.status).toBe(403);
      expect(response2.body).toEqual({
        statusCode: 403,
        error: 'Forbidden',
        message: ['forbidden'],
      });
    });

    it('should return error if disabled by setting', async () => {
      const settings = await app.get(SettingsService);
      const settingId = (await settings.getSettings()).find(
        (s) => s.name === 'Product rating photos',
      )?.id;
      await settings.updateSetting(settingId ?? -1, { value: 'false' });
      const createData = generate(ProductRatingDto, true);
      createData.rating = 5;
      const id = (
        await request(app.getHttpServer())
          .post(`/products/${testProduct.id}/ratings`)
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body.id;
      const response = await request(app.getHttpServer())
        .post(`/products/${testProduct.id}/ratings/${id}/photos`)
        .set('Cookie', cookieHeader)
        .attach('file', './test/assets/test.jpg');
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        message: 'Not Found',
      });
      await settings.updateSetting(settingId ?? -1, { value: 'true' });
    });

    it('should return error if product not found', async () => {
      const response = await request(app.getHttpServer())
        .post(`/products/${12345}/ratings/${testRating.id}/photos`)
        .set('Cookie', cookieHeader)
        .attach('file', './test/assets/test.jpg');
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        error: 'Not Found',
        message: [`product rating with id=${testRating.id} not found`],
      });
    });

    it('should return error if product rating not found', async () => {
      const response = await request(app.getHttpServer())
        .post(`/products/${testProduct.id}/ratings/${12345}/photos`)
        .set('Cookie', cookieHeader)
        .attach('file', './test/assets/test.jpg');
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        error: 'Not Found',
        message: ['product rating with id=12345 not found'],
      });
    });
  });

  describe('/products/:productId/ratings/:id/photos/:photoId (DELETE)', () => {
    it('should delete photo from product rating', async () => {
      const createData = generate(ProductRatingDto, true);
      createData.rating = 5;
      const id = (
        await request(app.getHttpServer())
          .post(`/products/${testProduct.id}/ratings`)
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body.id;
      const photoId = (
        await request(app.getHttpServer())
          .post(`/products/${testProduct.id}/ratings/${id}/photos`)
          .set('Cookie', cookieHeader)
          .attach('file', './test/assets/test.jpg')
      ).body.photos[0].id;
      const response = await request(app.getHttpServer())
        .delete(`/products/${testProduct.id}/ratings/${id}/photos/${photoId}`)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(200);
      expect(response.body.photos).toEqual([]);
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
      const photoId = (
        await request(app.getHttpServer())
          .post(`/products/${testProduct.id}/ratings/${id}/photos`)
          .set('Cookie', cookieHeader)
          .attach('file', './test/assets/test.jpg')
      ).body.photos[0].id;
      const settings = await app.get(SettingsService);
      const settingId = (await settings.getSettings()).find(
        (s) => s.name === 'Product rating photos',
      )?.id;
      await settings.updateSetting(settingId ?? -1, { value: 'false' });
      const response2 = await request(app.getHttpServer())
        .delete(`/products/${testProduct.id}/ratings/${id}/photos/${photoId}`)
        .set('Cookie', cookieHeader);
      expect(response2.status).toBe(404);
      expect(response2.body).toEqual({
        statusCode: 404,
        message: 'Not Found',
      });
      await settings.updateSetting(settingId ?? -1, { value: 'true' });
    });

    it('should return error if product not found', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/products/${12345}/ratings/${testRating.id}/photos/${12345}`)
        .set('Cookie', cookieHeader)
        .send();
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        error: 'Not Found',
        message: [`product rating with id=${testRating.id} not found`],
      });
    });

    it('should return error if product rating not found', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/products/${testProduct.id}/ratings/${12345}/photos/${12345}`)
        .set('Cookie', cookieHeader)
        .send();
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        error: 'Not Found',
        message: ['product rating with id=12345 not found'],
      });
    });
  });

  describe(
    'RBAC for /products/:productId/ratings/:id/photos',
    setupRbacTests(
      () => app,
      () => testUsers,
      [
        [
          '/products/:productId/ratings/:id/photos/:photoId (GET)',
          [Role.Admin, Role.Manager, Role.Sales, Role.Customer, Role.Disabled],
        ],
        [
          '/products/:productId/ratings/:id/photos (POST)',
          [Role.Admin, Role.Manager, Role.Sales, Role.Customer],
        ],
        [
          '/products/:productId/ratings/:id/photos/:photoId (DELETE)',
          [Role.Admin, Role.Manager, Role.Sales],
        ],
      ],
    ),
  );
});
