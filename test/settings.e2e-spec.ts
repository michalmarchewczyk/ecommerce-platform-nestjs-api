import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Role } from '../src/users/models/role.enum';
import { TestUsersService } from './utils/test-users/test-users.service';
import { TestUsersModule } from './utils/test-users/test-users.module';
import { DtoGeneratorService } from './utils/dto-generator/dto-generator.service';
import { setupRbacTests } from './utils/setup-rbac-tests';
import { Setting } from '../src/settings/models/setting.entity';
import { SettingCreateDto } from '../src/settings/dto/setting-create.dto';
import { SettingUpdateDto } from '../src/settings/dto/setting-update.dto';
import { SettingType } from '../src/settings/models/setting-type.enum';

describe('SettingsController (e2e)', () => {
  let app: INestApplication;
  let testUsers: TestUsersService;
  let cookieHeader: string;
  let testSetting: Setting;
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

    testSetting = (
      await request(app.getHttpServer())
        .post('/settings')
        .set('Cookie', cookieHeader)
        .send({
          ...generate(SettingCreateDto, true),
          type: 'string',
        })
    ).body;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/settings (GET)', () => {
    it('should return all settings', async () => {
      const response = await request(app.getHttpServer())
        .get('/settings')
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(200);
      expect(response.body).toContainEqual(testSetting);
    });
  });

  describe('/settings/:id (GET)', () => {
    it('should return setting by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/settings/${testSetting.id}`)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(200);
      expect(response.body).toEqual(testSetting);
    });

    it('should return error if setting not found', async () => {
      const response = await request(app.getHttpServer())
        .get('/settings/12345')
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        message: ['setting with id=12345 not found'],
        error: 'Not Found',
      });
    });
  });

  describe('/settings/:name/value (GET)', () => {
    it('should return setting value by name', async () => {
      const response = await request(app.getHttpServer())
        .get(`/settings/${testSetting.name}/value`)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(200);
      expect(response.text).toEqual(testSetting.value);
    });

    it('should return error if setting not found', async () => {
      const response = await request(app.getHttpServer())
        .get('/settings/12345/value')
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        message: ['setting with name=12345 not found'],
        error: 'Not Found',
      });
    });
  });

  describe('/settings (POST)', () => {
    it('should create setting', async () => {
      const createData = generate(SettingCreateDto, true);
      createData.type = SettingType.String;
      const response = await request(app.getHttpServer())
        .post('/settings')
        .set('Cookie', cookieHeader)
        .send(createData);
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        ...createData,
        id: expect.any(Number),
        updated: expect.any(String),
      });
    });

    it('should return error if data is invalid', async () => {
      const createData = generate(SettingCreateDto, true);
      createData.type = '' as any;
      const response = await request(app.getHttpServer())
        .post('/settings')
        .set('Cookie', cookieHeader)
        .send(createData);
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        statusCode: 400,
        message: [
          'type must be one of the following values: boolean, number, string, currencyCode, currenciesList, country, countriesList',
        ],
        error: 'Bad Request',
      });
    });

    it('should return error if value does not match type', async () => {
      const createData = generate(SettingCreateDto, true);
      createData.type = SettingType.Boolean;
      createData.value = 'test';
      const response = await request(app.getHttpServer())
        .post('/settings')
        .set('Cookie', cookieHeader)
        .send(createData);
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        statusCode: 400,
        message: ['setting value is not of type boolean'],
        error: 'Bad Request',
      });
    });

    it('should return error if value does not match array type', async () => {
      const createData = generate(SettingCreateDto, true);
      createData.type = SettingType.CurrenciesList;
      createData.value = 'test';
      const response = await request(app.getHttpServer())
        .post('/settings')
        .set('Cookie', cookieHeader)
        .send(createData);
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        statusCode: 400,
        message: ['setting value is not of type array of currency codes'],
        error: 'Bad Request',
      });
    });
  });

  describe('/settings/:id (PATCH)', () => {
    it('should update setting', async () => {
      const createData = generate(SettingCreateDto, true);
      createData.type = SettingType.String;
      const id = (
        await request(app.getHttpServer())
          .post('/settings')
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body.id;
      const updateData = generate(SettingUpdateDto, true);
      const response = await request(app.getHttpServer())
        .patch(`/settings/${id}`)
        .set('Cookie', cookieHeader)
        .send(updateData);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ...createData,
        ...updateData,
        id,
        updated: expect.any(String),
      });
    });

    it('should return error if setting not found', async () => {
      const response = await request(app.getHttpServer())
        .patch('/settings/12345')
        .set('Cookie', cookieHeader)
        .send(generate(SettingUpdateDto, true));
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        message: ['setting with id=12345 not found'],
        error: 'Not Found',
      });
    });

    it('should return error if data is invalid', async () => {
      const createData = generate(SettingCreateDto, true);
      createData.type = SettingType.String;
      const id = (
        await request(app.getHttpServer())
          .post('/settings')
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body.id;
      const updateData = generate(SettingUpdateDto, true);
      updateData.value = 0 as any;
      const response = await request(app.getHttpServer())
        .patch(`/settings/${id}`)
        .set('Cookie', cookieHeader)
        .send(updateData);
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        statusCode: 400,
        message: ['value must be a string'],
        error: 'Bad Request',
      });
    });

    it('should return error if value does not match type', async () => {
      const createData = generate(SettingCreateDto, true);
      createData.type = SettingType.CountriesList;
      createData.value = 'US,PL';
      const id = (
        await request(app.getHttpServer())
          .post('/settings')
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body.id;
      const updateData = generate(SettingUpdateDto, true);
      updateData.value = 'test';
      const response = await request(app.getHttpServer())
        .patch(`/settings/${id}`)
        .set('Cookie', cookieHeader)
        .send(updateData);
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        statusCode: 400,
        message: ['setting value is not of type array of alpha2 country codes'],
        error: 'Bad Request',
      });
    });
  });

  describe('/settings/:id (DELETE)', () => {
    it('should delete setting', async () => {
      const createData = generate(SettingCreateDto, true);
      createData.builtin = false;
      createData.type = SettingType.String;
      const id = (
        await request(app.getHttpServer())
          .post('/settings')
          .set('Cookie', cookieHeader)
          .send(createData)
      ).body.id;
      const response = await request(app.getHttpServer())
        .delete(`/settings/${id}`)
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({});
    });

    it('should return error if setting not found', async () => {
      const response = await request(app.getHttpServer())
        .delete('/settings/12345')
        .set('Cookie', cookieHeader);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        statusCode: 404,
        message: ['setting with id=12345 not found'],
        error: 'Not Found',
      });
    });
  });

  describe(
    'RBAC for /settings',
    setupRbacTests(
      () => app,
      () => testUsers,
      [
        [
          '/settings (GET)',
          [Role.Admin, Role.Manager, Role.Sales, Role.Customer, Role.Disabled],
        ],
        ['/settings (POST)', [Role.Admin]],
        [
          '/settings/:id (GET)',
          [Role.Admin, Role.Manager, Role.Sales, Role.Customer, Role.Disabled],
        ],
        [
          '/settings/:name/value (GET)',
          [Role.Admin, Role.Manager, Role.Sales, Role.Customer, Role.Disabled],
        ],
        ['/settings/:id (PATCH)', [Role.Admin]],
        ['/settings/:id (DELETE)', [Role.Admin]],
      ],
    ),
  );
});
