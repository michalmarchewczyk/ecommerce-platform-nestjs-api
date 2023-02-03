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
import { ProductUpdateDto } from '../../src/catalog/products/dto/product-update.dto';
import { AttributeDto } from '../../src/catalog/products/dto/attribute.dto';
import { AttributeTypeDto } from '../../src/catalog/attribute-types/dto/attribute-type.dto';
import { setupRbacTests } from '../utils/setup-rbac-tests';
import { AttributeValueType } from '../../src/catalog/attribute-types/models/attribute-value-type.enum';

describe('ProductsController (e2e)', () => {
  let app: INestApplication;
  let testUsers: TestUsersService;
  let cookieHeader: string;
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

    const createData = generate(ProductCreateDto);
    createData.visible = true;
    testProduct = (
      await request(app.getHttpServer())
        .post('/products')
        .set('Cookie', cookieHeader)
        .send(createData)
    ).body;
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
        ...testProduct,
        attributes: [],
        photos: [],
      });
    });
  });

  describe('/products/:id (GET)', () => {
    it('should return product by id', async () => {
      const response = await request(app.getHttpServer())
        .get('/products/' + testProduct.id)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ...testProduct,
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
        message: ['product with id=12345 not found'],
        error: 'Not Found',
      });
    });
  });

  describe('/products (POST)', () => {
    it('should create product', async () => {
      const createData = generate(ProductCreateDto);
      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Cookie', cookieHeader)
        .send(createData);
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        id: expect.any(Number),
        ...createData,
        visible: true,
        created: expect.any(String),
        updated: expect.any(String),
        photosOrder: '',
      });
    });

    it('should return error when data is invalid', async () => {
      const createData = generate(ProductCreateDto);
      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Cookie', cookieHeader)
        .send({
          ...createData,
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

  describe('/products/:id (PATCH)', () => {
    it('should update product', async () => {
      const createData = generate(ProductCreateDto);
      const id = (
        await request(app.getHttpServer())
          .post('/products')
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body.id;
      const updateData = generate(ProductUpdateDto, true);
      updateData.photosOrder = '';
      const response = await request(app.getHttpServer())
        .patch('/products/' + id)
        .set('Cookie', cookieHeader)
        .send(updateData);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: expect.any(Number),
        ...updateData,
        created: expect.any(String),
        updated: expect.any(String),
        attributes: [],
        photos: [],
      });
      expect(response.body.created).not.toBe(response.body.updated);
    });

    it('should update product photos order', async () => {
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
        .post('/products/' + id + '/photos')
        .set('Cookie', cookieHeader)
        .attach('file', './test/assets/test.png');
      const response3 = await request(app.getHttpServer())
        .patch('/products/' + id)
        .set('Cookie', cookieHeader)
        .send({
          photosOrder:
            response2.body.photos[1].id + ',' + response.body.photos[0].id,
        });
      expect(response3.status).toBe(200);
      expect(response3.body.photosOrder).toBe(
        response2.body.photos[1].id + ',' + response.body.photos[0].id,
      );
    });

    it('should return error if product photos order is not correct', async () => {
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
        .patch('/products/' + id)
        .set('Cookie', cookieHeader)
        .send({
          photosOrder: '12345,' + response.body.photos[0].id,
        });
      expect(response2.status).toBe(404);
      expect(response2.body).toEqual({
        statusCode: 404,
        message: ['product photo not found'],
        error: 'Not Found',
      });
    });

    it('should return error if product not found', async () => {
      const updateData = generate(ProductUpdateDto, true);
      const response = await request(app.getHttpServer())
        .patch('/products/12345')
        .set('Cookie', cookieHeader)
        .send(updateData);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        message: ['product with id=12345 not found'],
        error: 'Not Found',
      });
    });

    it('should return error when data is invalid', async () => {
      const createData = generate(ProductCreateDto);
      const id = (
        await request(app.getHttpServer())
          .post('/products')
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body.id;
      const updateData = generate(ProductUpdateDto, true);
      const response = await request(app.getHttpServer())
        .patch('/products/' + id)
        .set('Cookie', cookieHeader)
        .send({
          ...updateData,
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
      const createData = generate(ProductCreateDto);
      const id = (
        await request(app.getHttpServer())
          .post('/products')
          .set('Cookie', cookieHeader)
          .send(createData)
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
        message: ['product with id=12345 not found'],
        error: 'Not Found',
      });
    });
  });

  describe('/products/:id/attributes (PATCH)', () => {
    it('should update product attributes', async () => {
      const createData = generate(ProductCreateDto);
      const id = (
        await request(app.getHttpServer())
          .post('/products')
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body.id;
      const attributeTypeData = generate(AttributeTypeDto);
      attributeTypeData.valueType = AttributeValueType.String;
      const attrId = (
        await request(app.getHttpServer())
          .post('/attribute-types')
          .set('Cookie', cookieHeader)
          .send(attributeTypeData)
      ).body.id;
      const attributeData = generate(AttributeDto);
      const response = await request(app.getHttpServer())
        .patch('/products/' + id + '/attributes')
        .set('Cookie', cookieHeader)
        .send([
          {
            ...attributeData,
            typeId: attrId,
          },
        ]);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: expect.any(Number),
        ...createData,
        visible: true,
        created: expect.any(String),
        updated: expect.any(String),
        photosOrder: '',
        attributes: [
          {
            id: expect.any(Number),
            value: attributeData.value,
            type: {
              id: attrId,
              ...attributeTypeData,
            },
          },
        ],
        photos: [],
      });
    });

    it('should return error if value does not match attribute type', async () => {
      const createData = generate(ProductCreateDto);
      const id = (
        await request(app.getHttpServer())
          .post('/products')
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body.id;
      const attributeTypeData = generate(AttributeTypeDto);
      attributeTypeData.valueType = AttributeValueType.Number;
      const attrId = (
        await request(app.getHttpServer())
          .post('/attribute-types')
          .set('Cookie', cookieHeader)
          .send(attributeTypeData)
      ).body.id;
      const attributeData = generate(AttributeDto);
      const response = await request(app.getHttpServer())
        .patch('/products/' + id + '/attributes')
        .set('Cookie', cookieHeader)
        .send([
          {
            ...attributeData,
            typeId: attrId,
          },
        ]);
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        statusCode: 400,
        message: ['attribute value is not of type number'],
        error: 'Bad Request',
      });
    });

    it('should return error if product not found', async () => {
      const response = await request(app.getHttpServer())
        .patch('/products/12345/attributes')
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        message: ['product with id=12345 not found'],
        error: 'Not Found',
      });
    });

    it('should return error if attribute type not found', async () => {
      const createData = generate(ProductCreateDto);
      const id = (
        await request(app.getHttpServer())
          .post('/products')
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body.id;
      const attributeData = generate(AttributeDto);
      const response = await request(app.getHttpServer())
        .patch('/products/' + id + '/attributes')
        .set('Cookie', cookieHeader)
        .send([
          {
            ...attributeData,
            typeId: 12345,
          },
        ]);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        message: ['attribute type with id=12345 not found'],
        error: 'Not Found',
      });
    });
  });

  describe(
    'RBAC for /products',
    setupRbacTests(
      () => app,
      () => testUsers,
      [
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
      ],
    ),
  );
});
