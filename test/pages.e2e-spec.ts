import { PageCreateDto } from '../src/pages/dto/page-create.dto';
import { INestApplication } from '@nestjs/common';
import { TestUsersService } from './utils/test-users/test-users.service';
import { Page } from '../src/pages/models/page.entity';
import { DtoGeneratorService } from './utils/dto-generator/dto-generator.service';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { TestUsersModule } from './utils/test-users/test-users.module';
import * as request from 'supertest';
import { Role } from '../src/users/models/role.enum';
import { setupRbacTests } from './utils/setup-rbac-tests';
import { PageUpdateDto } from '../src/pages/dto/page-update.dto';

describe('PagesController (e2e)', () => {
  let app: INestApplication;
  let testUsers: TestUsersService;
  let cookieHeader: string;
  let testPage: Page;
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

    const createData = generate(PageCreateDto);
    testPage = (
      await request(app.getHttpServer())
        .post('/pages')
        .set('Cookie', cookieHeader)
        .send(createData)
    ).body;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/pages (GET)', () => {
    it('should return all pages', async () => {
      const response = await request(app.getHttpServer())
        .get('/pages')
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(200);
      expect(response.body).toContainEqual({
        ...testPage,
        groups: [],
      });
    });
  });

  describe('/pages/groups (GET)', () => {
    it('should return all page groups', async () => {
      const response = await request(app.getHttpServer())
        .get('/pages/groups')
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('/pages/:id (GET)', () => {
    it('should return page with given id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/pages/${testPage.id}`)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ...testPage,
        groups: [],
      });
    });

    it('should return error if page with given id does not exist', async () => {
      const response = await request(app.getHttpServer())
        .get('/pages/12345')
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: ['page with id=12345 not found'],
        statusCode: 404,
        error: 'Not Found',
      });
    });
  });

  describe('/pages (POST)', () => {
    it('should create new page', async () => {
      const createData = generate(PageCreateDto);
      const response = await request(app.getHttpServer())
        .post('/pages')
        .set('Cookie', cookieHeader)
        .send(createData);
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        id: expect.any(Number),
        ...createData,
        slug: null,
        created: expect.any(String),
        updated: expect.any(String),
      });
    });

    it('should return error if data is invalid', async () => {
      const createData = generate(PageCreateDto);
      const response = await request(app.getHttpServer())
        .post('/pages')
        .set('Cookie', cookieHeader)
        .send({
          ...createData,
          title: '',
        });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: ['title should not be empty'],
        statusCode: 400,
        error: 'Bad Request',
      });
    });
  });

  describe('/pages/:id (PATCH)', () => {
    it('should update page with given id', async () => {
      const createData = generate(PageCreateDto);
      const id = (
        await request(app.getHttpServer())
          .post('/pages')
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body.id;
      const updateData = generate(PageUpdateDto, true);
      updateData.groups = [
        {
          name: 'test group',
        },
      ];
      const response = await request(app.getHttpServer())
        .patch('/pages/' + id)
        .set('Cookie', cookieHeader)
        .send(updateData);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id,
        ...updateData,
        created: expect.any(String),
        updated: expect.any(String),
        groups: [{ name: 'test group', id: expect.any(Number) }],
      });
    });

    it('should return error if page with given id does not exist', async () => {
      const updateData = generate(PageUpdateDto, true);
      const response = await request(app.getHttpServer())
        .patch('/pages/12345')
        .set('Cookie', cookieHeader)
        .send(updateData);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: ['page with id=12345 not found'],
        statusCode: 404,
        error: 'Not Found',
      });
    });

    it('should return error if data is invalid', async () => {
      const updateData = generate(PageUpdateDto, true);
      const response = await request(app.getHttpServer())
        .patch(`/pages/${testPage.id}`)
        .set('Cookie', cookieHeader)
        .send({
          ...updateData,
          title: '',
        });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: ['title should not be empty'],
        statusCode: 400,
        error: 'Bad Request',
      });
    });
  });

  describe('/pages/:id (DELETE)', () => {
    it('should delete page with given id', async () => {
      const createData = generate(PageCreateDto);
      const id = (
        await request(app.getHttpServer())
          .post('/pages')
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body.id;
      const response = await request(app.getHttpServer())
        .delete('/pages/' + id)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({});
    });

    it('should return error if page with given id does not exist', async () => {
      const response = await request(app.getHttpServer())
        .delete('/pages/12345')
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: ['page with id=12345 not found'],
        statusCode: 404,
        error: 'Not Found',
      });
    });
  });

  describe(
    'RBAC for /pages',
    setupRbacTests(
      () => app,
      () => testUsers,
      [
        [
          '/pages (GET)',
          [Role.Admin, Role.Manager, Role.Sales, Role.Customer, Role.Disabled],
        ],
        [
          '/pages/groups (GET)',
          [Role.Admin, Role.Manager, Role.Sales, Role.Customer, Role.Disabled],
        ],
        ['/pages (POST)', [Role.Admin]],
        [
          '/pages/:id (GET)',
          [Role.Admin, Role.Manager, Role.Sales, Role.Customer, Role.Disabled],
        ],
        ['/pages/:id (PATCH)', [Role.Admin]],
        ['/pages/:id (DELETE)', [Role.Admin]],
      ],
    ),
  );
});
