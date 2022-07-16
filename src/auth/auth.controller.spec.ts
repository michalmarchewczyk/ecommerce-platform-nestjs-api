import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { DtoGeneratorService } from '../../test/utils/dto-generator/dto-generator.service';
import { RegisterDto } from './dto/register.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let generate: DtoGeneratorService['generate'];
  const mockUsersService = {
    addUser: jest.fn(
      (
        email: string,
        hashedPassword: string,
        firstName?: string,
        lastName?: string,
      ) => ({ email, firstName, lastName }),
    ),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        DtoGeneratorService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
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
      expect(user).toEqual({ email });
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
      expect(user).toEqual({ email, firstName, lastName });
    });
  });

  describe('login', () => {
    it('should return req.user', async () => {
      const { email, password } = generate(RegisterDto);
      const user = await controller.login({ user: { email, password } });
      expect(user).toBeDefined();
      expect(user).toEqual({ email, password });
    });
  });

  describe('logout', () => {
    it('should call logout method', async () => {
      const logout = jest.fn();
      await controller.logout({ logOut: logout });
      expect(logout).toHaveBeenCalled();
    });
  });
});
