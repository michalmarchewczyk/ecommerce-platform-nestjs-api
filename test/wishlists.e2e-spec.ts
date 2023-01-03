import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Role } from '../src/users/models/role.enum';
import { TestUsersService } from './utils/test-users/test-users.service';
import { TestUsersModule } from './utils/test-users/test-users.module';
import { DtoGeneratorService } from './utils/dto-generator/dto-generator.service';
import { ProductCreateDto } from '../src/catalog/products/dto/product-create.dto';
import { Product } from '../src/catalog/products/models/product.entity';
import { setupRbacTests } from './utils/setup-rbac-tests';
import { Wishlist } from '../src/wishlists/models/wishlist.entity';
import { WishlistCreateDto } from '../src/wishlists/dto/wishlist-create.dto';

describe('WishlistsController (e2e)', () => {
  let app: INestApplication;
  let testUsers: TestUsersService;
  let cookieHeader: string;
  let testProduct: Product;
  let testWishlist: Wishlist;
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

    const createData = generate(WishlistCreateDto);
    createData.productIds = [testProduct.id];
    testWishlist = (
      await request(app.getHttpServer())
        .post('/wishlists')
        .set('Cookie', cookieHeader)
        .send(createData)
    ).body;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/wishlists (GET)', () => {
    it('should return user wishlists', async () => {
      const response = await request(app.getHttpServer())
        .get('/wishlists')
        .set('Cookie', cookieHeader);
      const { user, ...toExpect } = testWishlist;
      expect(response.status).toBe(200);
      expect(response.body).toContainEqual(toExpect);
    });

    it('should return other user wishlists', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          ...testUsers.getCredentials(Role.Customer),
        });
      const cookieHeader = response.headers['set-cookie'];
      const response2 = await request(app.getHttpServer())
        .get('/wishlists')
        .set('Cookie', cookieHeader);
      expect(response2.status).toBe(200);
      expect(response2.body).toEqual([]);
    });
  });

  describe('/wishlists (POST)', () => {
    it('should create wishlist', async () => {
      const createData = generate(WishlistCreateDto);
      createData.productIds = [testProduct.id];
      const response = await request(app.getHttpServer())
        .post('/wishlists')
        .set('Cookie', cookieHeader)
        .send(createData);
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({ name: createData.name });
    });

    it('should return error when product is not found', async () => {
      const createData = generate(WishlistCreateDto);
      createData.productIds = [12345];
      const response = await request(app.getHttpServer())
        .post('/wishlists')
        .set('Cookie', cookieHeader)
        .send(createData);
      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        statusCode: 404,
        message: ['product with id=12345 not found'],
        error: 'Not Found',
      });
    });
  });

  describe('/wishlists/:id (PATCH)', () => {
    it('should update wishlist', async () => {
      const createData = generate(WishlistCreateDto);
      createData.productIds = [];
      const id = (
        await request(app.getHttpServer())
          .post('/wishlists')
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body.id;
      const updateData = generate(WishlistCreateDto, true);
      updateData.productIds = [testProduct.id];
      const response = await request(app.getHttpServer())
        .patch(`/wishlists/${id}`)
        .set('Cookie', cookieHeader)
        .send(updateData);
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ name: updateData.name });
    });

    it('should keep data that is not updated', async () => {
      const createData = generate(WishlistCreateDto);
      createData.productIds = [];
      const id = (
        await request(app.getHttpServer())
          .post('/wishlists')
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body.id;
      const response = await request(app.getHttpServer())
        .patch(`/wishlists/${id}`)
        .set('Cookie', cookieHeader)
        .send({});
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ name: createData.name });
    });

    it('should return error when product is not found', async () => {
      const createData = generate(WishlistCreateDto);
      createData.productIds = [];
      const id = (
        await request(app.getHttpServer())
          .post('/wishlists')
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body.id;
      const updateData = generate(WishlistCreateDto, true);
      updateData.productIds = [12345];
      const response = await request(app.getHttpServer())
        .patch(`/wishlists/${id}`)
        .set('Cookie', cookieHeader)
        .send(updateData);
      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        statusCode: 404,
        message: ['product with id=12345 not found'],
        error: 'Not Found',
      });
    });

    it('should return error when wishlist is not found', async () => {
      const updateData = generate(WishlistCreateDto, true);
      updateData.productIds = [12345];
      const response = await request(app.getHttpServer())
        .patch(`/wishlists/${12345}`)
        .set('Cookie', cookieHeader)
        .send(updateData);
      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        statusCode: 404,
        message: ['wishlist not found'],
        error: 'Not Found',
      });
    });
  });

  describe('/wishlists/:id (DELETE)', () => {
    it('should delete wishlist', async () => {
      const createData = generate(WishlistCreateDto);
      createData.productIds = [];
      const id = (
        await request(app.getHttpServer())
          .post('/wishlists')
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body.id;
      const response = await request(app.getHttpServer())
        .delete(`/wishlists/${id}`)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(200);
    });

    it('should return error when wishlist is not found', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/wishlists/${12345}`)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        statusCode: 404,
        message: ['wishlist not found'],
        error: 'Not Found',
      });
    });
  });

  describe(
    'RBAC for /wishlists',
    setupRbacTests(
      () => app,
      () => testUsers,
      [
        [
          '/wishlists (GET)',
          [Role.Admin, Role.Manager, Role.Sales, Role.Customer],
        ],
        [
          '/wishlists (POST)',
          [Role.Admin, Role.Manager, Role.Sales, Role.Customer],
        ],
        [
          '/wishlists/:id (PATCH)',
          [Role.Admin, Role.Manager, Role.Sales, Role.Customer],
        ],
        [
          '/wishlists/:id (DELETE)',
          [Role.Admin, Role.Manager, Role.Sales, Role.Customer],
        ],
      ],
    ),
  );
});
