import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  describe('/auth/register (POST)', () => {
    it('should return user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@test.local',
          password: 'test1234',
        });
      expect(response.status).toBe(201);
      expect(response.body.email).toBe('test@test.local');
    });

    it('should return user with optional fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@test.local',
          password: 'test1234',
          firstName: 'Test',
          lastName: 'User',
        });
      expect(response.status).toBe(201);
      expect(response.body.email).toBe('test@test.local');
      expect(response.body.firstName).toBe('Test');
      expect(response.body.lastName).toBe('User');
    });

    it('should return error when invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test',
          password: 'test1234',
        });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        statusCode: 400,
        message: ['email must be an email'],
        error: 'Bad Request',
      });
    });

    it('should return error when short password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@test.local',
          password: 'test',
        });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        statusCode: 400,
        message: ['password must be longer than or equal to 8 characters'],
        error: 'Bad Request',
      });
    });

    it('should return error when duplicate email', async () => {
      await request(app.getHttpServer()).post('/auth/register').send({
        email: 'test@test.local',
        password: 'test1234',
      });
      const response2 = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@test.local',
          password: 'test1234',
        });
      expect(response2.status).toBe(409);
      expect(response2.body).toEqual({
        statusCode: 409,
        message: ['user already exists'],
        error: 'Conflict',
      });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});