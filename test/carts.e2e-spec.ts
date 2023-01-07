import { INestApplication } from '@nestjs/common';
import { TestUsersService } from './utils/test-users/test-users.service';
import { Product } from '../src/catalog/products/models/product.entity';
import { DtoGeneratorService } from './utils/dto-generator/dto-generator.service';
import { AppModule } from '../src/app.module';
import { TestUsersModule } from './utils/test-users/test-users.module';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '../src/users/models/role.enum';
import * as request from 'supertest';
import { ProductCreateDto } from '../src/catalog/products/dto/product-create.dto';
import { setupRbacTests } from './utils/setup-rbac-tests';

describe('CartsController (e2e)', () => {
  let app: INestApplication;
  let testUsers: TestUsersService;
  let cookieHeaderUser: string;
  let cookieHeaderSession: string;
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
    cookieHeaderUser = response.headers['set-cookie'];

    const response2 = await request(app.getHttpServer()).get('/carts/my');
    cookieHeaderSession = response2.headers['set-cookie'];

    const productData = generate(ProductCreateDto);
    productData.visible = true;
    testProduct = (
      await request(app.getHttpServer())
        .post('/products')
        .set('Cookie', cookieHeaderUser)
        .send(productData)
    ).body;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/carts/my (GET)', () => {
    it('should return users cart', async () => {
      const response = await request(app.getHttpServer())
        .get('/carts/my')
        .set('Cookie', cookieHeaderUser);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: expect.any(Number),
        sessionId: null,
        user: expect.any(Object),
        updated: expect.any(String),
        items: [],
      });
    });

    it('should return session cart', async () => {
      const response = await request(app.getHttpServer())
        .get('/carts/my')
        .set('Cookie', cookieHeaderSession);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: expect.any(Number),
        sessionId: expect.any(String),
        updated: expect.any(String),
        items: [],
      });
    });
  });

  describe('/carts/my (PUT)', () => {
    it('should update users cart with products', async () => {
      const response = await request(app.getHttpServer())
        .put('/carts/my')
        .set('Cookie', cookieHeaderUser)
        .send({
          items: [{ quantity: 2, productId: testProduct.id }],
        });
      expect(response.status).toBe(200);
      const response2 = await request(app.getHttpServer())
        .get('/carts/my')
        .set('Cookie', cookieHeaderUser);
      expect(response2.body.items).toHaveLength(1);
      expect(response2.body.items[0]).toMatchObject({
        quantity: 2,
        product: testProduct,
      });
    });

    it('should update session cart with products', async () => {
      const response = await request(app.getHttpServer())
        .put('/carts/my')
        .set('Cookie', cookieHeaderSession)
        .send({
          items: [{ quantity: 1, productId: testProduct.id }],
        });
      expect(response.status).toBe(200);
      const response2 = await request(app.getHttpServer())
        .get('/carts/my')
        .set('Cookie', cookieHeaderSession);
      expect(response2.body.items).toHaveLength(1);
      expect(response2.body.items[0]).toMatchObject({
        quantity: 1,
        product: testProduct,
      });
    });
  });

  describe(
    'RBAC for /carts',
    setupRbacTests(
      () => app,
      () => testUsers,
      [
        [
          '/carts/my (GET)',
          [Role.Admin, Role.Manager, Role.Sales, Role.Customer, Role.Disabled],
        ],
        [
          '/carts/my (PUT)',
          [Role.Admin, Role.Manager, Role.Sales, Role.Customer, Role.Disabled],
        ],
      ],
    ),
  );
});
