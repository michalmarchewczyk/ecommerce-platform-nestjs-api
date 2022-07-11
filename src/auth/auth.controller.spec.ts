import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthController', () => {
  let controller: AuthController;
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthService],
    })
      .useMocker((token) => {
        if (token === UsersService) {
          return mockUsersService;
        }
      })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should return registered user', async () => {
      const email = 'test@test.local';
      const password = 'test';
      const user = await controller.register({ email, password });
      expect(user).toBeDefined();
      expect(user).toEqual({ email });
    });

    it('should return registered user with optional fields', async () => {
      const email = 'test@test.local';
      const password = 'test';
      const firstName = 'Test';
      const lastName = 'User';
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
    const email = 'test@test.local';
    const password = 'test';
    it('should return req.user', async () => {
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
