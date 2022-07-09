import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;
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
      providers: [AuthService],
    })
      .useMocker((token) => {
        if (token === UsersService) {
          return mockUsersService;
        }
      })
      .compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return registered user', async () => {
    const email = 'test@test.local';
    const password = 'test';
    const user = await service.register({ email, password });
    expect(user).toBeDefined();
    expect(user).toEqual({ email });
  });

  it('should return registered user with optional fields', async () => {
    const email = 'test@test.local';
    const password = 'test';
    const firstName = 'Test';
    const lastName = 'User';
    const user = await service.register({
      email,
      password,
      firstName,
      lastName,
    });
    expect(user).toBeDefined();
    expect(user).toEqual({ email, firstName, lastName });
  });

  it('should hash password when registering', async () => {
    const email = 'test@test.local';
    const password = 'test';
    await service.register({ email, password });
    expect(mockUsersService.addUser).not.toHaveBeenLastCalledWith(
      email,
      password,
      undefined,
      undefined,
    );
  });
});
