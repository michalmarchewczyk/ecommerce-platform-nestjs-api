import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Role } from '../src/users/models/role.enum';
import { TestUsersService } from './utils/test-users/test-users.service';
import { TestUsersModule } from './utils/test-users/test-users.module';
import * as exportJson from './assets/export.json';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

describe('Import/ExportController (e2e)', () => {
  let app: INestApplication;
  let testUsers: TestUsersService;
  let cookieHeader: string;

  beforeAll(async () => {
    jest.setTimeout(30 * 1000);
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            type: 'postgres',
            host: configService.get<string>('postgres.host'),
            port: configService.get<number>('postgres.port'),
            username: configService.get<string>('postgres.username'),
            password: configService.get<string>('postgres.password'),
            database: configService.get<string>('postgres.database'),
            entities: [],
            synchronize: true,
            autoLoadEntities: true,
            keepConnectionAlive: true,
            dropSchema: true,
            entityPrefix: 'import_export_test_',
          }),
          inject: [ConfigService],
        }),
        AppModule,
        TestUsersModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    testUsers = moduleFixture.get<TestUsersService>(TestUsersService);
    await app.init();
    await testUsers.init();

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        ...testUsers.getCredentials(Role.Admin),
      });
    cookieHeader = response.headers['set-cookie'];

    await request(app.getHttpServer())
      .post('/import')
      .set('Cookie', cookieHeader)
      .field('clear', 'true')
      .field('noImport', 'true')
      .attach('file', './test/assets/export.json');
  }, 30 * 1000);

  afterAll(async () => {
    await app.close();
  });

  describe('/import (POST)', () => {
    it('should import from json', async () => {
      const response = await request(app.getHttpServer())
        .post('/import')
        .set('Cookie', cookieHeader)
        .attach('file', './test/assets/export.json');
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        deleted: {},
        added: {
          attributeTypes: 4,
          categories: 5,
          deliveryMethods: 3,
          orders: 3,
          paymentMethods: 3,
          products: 3,
          returns: 1,
          settings: 7,
          users: 5,
          wishlists: 3,
        },
        errors: [],
      });
    });

    it('should clear database without importing', async () => {
      const response = await request(app.getHttpServer())
        .post('/import')
        .set('Cookie', cookieHeader)
        .field('clear', 'true')
        .field('noImport', 'true')
        .attach('file', './test/assets/export.json');
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        deleted: {
          attributeTypes: 4,
          categories: 5,
          deliveryMethods: 3,
          orders: 3,
          paymentMethods: 3,
          products: 3,
          returns: 1,
          settings: expect.any(Number),
          users: expect.any(Number),
          wishlists: 3,
        },
        added: {},
        errors: [],
      });
    });

    it('should import from csv', async () => {
      const response = await request(app.getHttpServer())
        .post('/import')
        .set('Cookie', cookieHeader)
        .attach('file', './test/assets/export.tar.gz');
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        deleted: {},
        added: {
          attributeTypes: 4,
          categories: 5,
          deliveryMethods: 3,
          orders: 3,
          paymentMethods: 3,
          products: 3,
          returns: 1,
          settings: expect.any(Number),
          users: expect.any(Number),
          wishlists: 3,
        },
        errors: [],
      });
    });
  });

  describe('/export (GET)', () => {
    it('should export data', async () => {
      const response = await request(app.getHttpServer())
        .get('/export')
        .set('Cookie', cookieHeader)
        .send({
          data: [
            'users',
            'settings',
            'attributeTypes',
            'products',
            'categories',
            'wishlists',
            'deliveryMethods',
            'paymentMethods',
            'orders',
            'returns',
          ],
          format: 'json',
        });
      expect(response.status).toBe(200);
      for (const key in exportJson) {
        expect(Array.isArray(response.body[key])).toBe(true);
        expect(response.body[key].length).toBeGreaterThanOrEqual(
          (exportJson as Record<string, any>)[key].length,
        );
      }
    });

    it('should export data as csv', async () => {
      const response = await request(app.getHttpServer())
        .get('/export')
        .set('Cookie', cookieHeader)
        .send({
          data: [
            'users',
            'settings',
            'attributeTypes',
            'products',
            'categories',
            'wishlists',
            'deliveryMethods',
            'paymentMethods',
            'orders',
            'returns',
          ],
          format: 'csv',
        });
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/gzip');
    });
  });
});
