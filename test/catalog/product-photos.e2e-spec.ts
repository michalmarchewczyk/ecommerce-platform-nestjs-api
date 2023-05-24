import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { Role } from '../../src/users/models/role.enum';
import { TestUsersService } from '../utils/test-users/test-users.service';
import { TestUsersModule } from '../utils/test-users/test-users.module';
import { DtoGeneratorService } from '../utils/dto-generator/dto-generator.service';
import { ProductCreateDto } from '../../src/catalog/products/dto/product-create.dto';
import { setupRbacTests } from '../utils/setup-rbac-tests';
import { SettingsService } from '../../src/settings/settings.service';

describe('ProductPhotosController (e2e)', () => {
  let app: INestApplication;
  let testUsers: TestUsersService;
  let cookieHeader: string;
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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/products/:id/photos (POST)', () => {
    it('should add photo to product', async () => {
      const createData = generate(ProductCreateDto);
      const id = (
        await request(app.getHttpServer())
          .post('/products')
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body.id;
      const response = await request(app.getHttpServer())
        .post('/products/' + id + '/photos')
        .set('Cookie', cookieHeader)
        .attach('file', './test/assets/test.png');
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        id: expect.any(Number),
        ...createData,
        visible: true,
        created: expect.any(String),
        updated: expect.any(String),
        photosOrder: expect.any(String),
        attributes: [],
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

    it('should add photo to product without conversion', async () => {
      const settings = await app.get(SettingsService);
      const settingId = (await settings.getSettings()).find(
        (s) => s.name === 'Convert images to JPEG',
      )?.id;
      await settings.updateSetting(settingId ?? -1, { value: 'false' });
      const createData = generate(ProductCreateDto);
      const id = (
        await request(app.getHttpServer())
          .post('/products')
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body.id;
      const response = await request(app.getHttpServer())
        .post('/products/' + id + '/photos')
        .set('Cookie', cookieHeader)
        .attach('file', './test/assets/test.png');
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        id: expect.any(Number),
        ...createData,
        visible: true,
        created: expect.any(String),
        updated: expect.any(String),
        photosOrder: expect.any(String),
        attributes: [],
        photos: [
          {
            id: expect.any(Number),
            mimeType: 'image/png',
            path: expect.any(String),
            thumbnailPath: expect.any(String),
            placeholderBase64: expect.any(String),
          },
        ],
      });
      expect(response.body.photos[0]).toEqual({
        id: expect.any(Number),
        mimeType: 'image/png',
        path: expect.any(String),
        thumbnailPath: expect.any(String),
        placeholderBase64: expect.any(String),
      });
    });

    it('should return error if wrong file type', async () => {
      const createData = generate(ProductCreateDto);
      const id = (
        await request(app.getHttpServer())
          .post('/products')
          .set('Cookie', cookieHeader)
          .send(createData)
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
        message: ['product with id=12345 not found'],
        error: 'Not Found',
      });
    });
  });

  describe('/products/:id/photos/:photoId (GET)', () => {
    it('should be able to get product photos', async () => {
      const createData = generate(ProductCreateDto);
      const id = (
        await request(app.getHttpServer())
          .post('/products')
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body.id;
      const response = await request(app.getHttpServer())
        .post('/products/' + id + '/photos')
        .set('Cookie', cookieHeader)
        .attach('file', './test/assets/test.jpg');
      const response2 = await request(app.getHttpServer())
        .get(`/products/${id}/photos/${response.body.photos[0].id}`)
        .set('Cookie', cookieHeader);
      expect(response2.status).toBe(200);
      expect(response2.headers['content-type']).toBe('image/jpeg');
    });

    it('should be able to get product photos thumbnails', async () => {
      const createData = generate(ProductCreateDto);
      const id = (
        await request(app.getHttpServer())
          .post('/products')
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body.id;
      const response = await request(app.getHttpServer())
        .post('/products/' + id + '/photos')
        .set('Cookie', cookieHeader)
        .attach('file', './test/assets/test.jpg');
      const response2 = await request(app.getHttpServer())
        .get(
          `/products/${id}/photos/${response.body.photos[0].id}/?thumbnail=true`,
        )
        .set('Cookie', cookieHeader);
      expect(response2.status).toBe(200);
      expect(response2.headers['content-type']).toBe('image/jpeg');
    });

    it('should return error if photo not found', async () => {
      const response = await request(app.getHttpServer())
        .get('/products/' + 123 + '/photos/' + 12345)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        message: ['product photo with id=12345 not found'],
        error: 'Not Found',
      });
    });
  });

  describe('/products/:id/photos/:photoId (DELETE)', () => {
    it('should delete photo from product', async () => {
      const createData = generate(ProductCreateDto);
      const id = (
        await request(app.getHttpServer())
          .post('/products')
          .set('Cookie', cookieHeader)
          .send(createData)
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
        message: ['product with id=12345 not found'],
        error: 'Not Found',
      });
    });
  });

  describe(
    'RBAC for /products/:id/photos',
    setupRbacTests(
      () => app,
      () => testUsers,
      [
        [
          '/products/:id/photos/:photoId (GET)',
          [Role.Admin, Role.Manager, Role.Sales, Role.Customer, Role.Disabled],
        ],
        ['/products/:id/photos (POST)', [Role.Admin, Role.Manager]],
        ['/products/:id/photos/:photoId (DELETE)', [Role.Admin, Role.Manager]],
      ],
    ),
  );
});
