import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { DtoGeneratorService } from '../../test/utils/dto-generator/dto-generator.service';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/models/user.entity';
import { RepositoryMockService } from '../../test/utils/repository-mock/repository-mock.service';
import { Role } from '../users/models/role.enum';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

describe('AuthController', () => {
  let controller: AuthController;
  let generate: DtoGeneratorService['generate'];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        ConfigService,
        DtoGeneratorService,
        UsersService,
        RepositoryMockService.getProvider(User),
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    generate = module
      .get<DtoGeneratorService>(DtoGeneratorService)
      .generate.bind(module.get<DtoGeneratorService>(DtoGeneratorService));
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should return registered user', async () => {
      const { email, password } = generate(RegisterDto);
      const user = await controller.register({ email, password });
      expect(user).toBeDefined();
      expect(user).toEqual({
        email,
        id: expect.any(Number),
        firstName: null,
        lastName: null,
        password: undefined,
        registered: expect.any(Date),
        role: Role.Customer,
      });
    });

    it('should return registered user with optional fields', async () => {
      const { email, password, firstName, lastName } = generate(
        RegisterDto,
        true,
      );
      const user = await controller.register({
        email,
        password,
        firstName,
        lastName,
      });
      expect(user).toBeDefined();
      expect(user).toEqual({
        email,
        firstName,
        lastName,
        id: expect.any(Number),
        registered: expect.any(Date),
        role: Role.Customer,
        password: undefined,
      });
    });
  });

  describe('login', () => {
    it('should return req.user', async () => {
      const { email, password } = generate(RegisterDto);
      const user = await controller.login({
        user: { email, password },
      } as unknown as Request);
      expect(user).toBeDefined();
      expect(user).toEqual({ email, password });
    });
  });

  describe('logout', () => {
    it('should call logout method', async () => {
      const logout = jest.fn();
      await controller.logout({ logOut: logout } as unknown as Request);
      expect(logout).toHaveBeenCalled();
    });
  });
});
