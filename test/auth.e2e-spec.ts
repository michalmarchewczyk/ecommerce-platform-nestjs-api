import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DtoGeneratorService } from './utils/dto-generator/dto-generator.service';
import { RegisterDto } from '../src/auth/dto/register.dto';
import { LoginDto } from '../src/auth/dto/login.dto';
import { Role } from '../src/users/models/role.enum';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let generate: DtoGeneratorService['generate'];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [DtoGeneratorService],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    generate = moduleFixture
      .get<DtoGeneratorService>(DtoGeneratorService)
      .generate.bind(
        moduleFixture.get<DtoGeneratorService>(DtoGeneratorService),
      );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should return user', async () => {
      const registerData = generate(RegisterDto);
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerData);
      expect(response.status).toBe(201);
      expect(response.body.email).toBe(registerData.email);
    });

    it('should return user with optional fields', async () => {
      const registerData = generate(RegisterDto, true);
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerData);
      expect(response.status).toBe(201);
      expect(response.body.email).toBe(registerData.email);
      expect(response.body.firstName).toBe(registerData.firstName);
      expect(response.body.lastName).toBe(registerData.lastName);
    });

    it('should return error when invalid email', async () => {
      const registerData = generate(RegisterDto);
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...registerData,
          email: 'test',
        });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        statusCode: 400,
        message: ['email must be an email'],
        error: 'Bad Request',
      });
    });

    it('should return error when short password', async () => {
      const registerData = generate(RegisterDto);
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...registerData,
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
      const registerData = generate(RegisterDto);
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerData);
      const response2 = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerData);
      expect(response2.status).toBe(409);
      expect(response2.body).toEqual({
        statusCode: 409,
        message: [
          `user could not be saved because of a conflict on email=${registerData.email}`,
        ],
        error: 'Conflict',
      });
    });
  });

  describe('/auth/login (POST)', () => {
    let registerData: RegisterDto;

    beforeAll(async () => {
      registerData = generate(RegisterDto);
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerData);
    });

    it('should return logged in user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(registerData);
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        email: registerData.email,
        id: expect.any(Number),
        role: Role.Customer,
      });
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return error when invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(generate(LoginDto, true));
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        statusCode: 401,
        message: ['unauthorized'],
        error: 'Unauthorized',
      });
    });

    it('should return error when invalid password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: registerData.email,
          password: 'test',
        });
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        statusCode: 401,
        message: ['unauthorized'],
        error: 'Unauthorized',
      });
    });
  });

  describe('/auth/logout (POST)', () => {
    let registerData: RegisterDto;

    beforeAll(async () => {
      registerData = generate(RegisterDto);
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerData);
    });

    it('should logout user', async () => {
      const { headers } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(registerData);
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', headers['set-cookie'])
        .send();
      expect(response.status).toBe(201);
      const response2 = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', headers['set-cookie'])
        .send();
      expect(response2.status).toBe(401);
    });

    it('should return error when not logged in', async () => {
      const response = await request(app.getHttpServer()).post('/auth/logout');
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        statusCode: 401,
        message: ['unauthorized'],
        error: 'Unauthorized',
      });
    });
  });
});
