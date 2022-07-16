import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { DtoGeneratorService } from '../../test/utils/dto-generator/dto-generator.service';
import { RegisterDto } from './dto/register.dto';

describe('AuthService', () => {
  let service: AuthService;
  let generate: DtoGeneratorService['generate'];
  const mockUsersService = {
    users: [],
    addUser: jest.fn(
      (
        email: string,
        hashedPassword: string,
        firstName?: string,
        lastName?: string,
      ) => {
        const user = {
          email,
          firstName,
          lastName,
          id: Date.now(),
          password: hashedPassword,
        };
        mockUsersService.users.push(user);
        return { ...user, password: undefined };
      },
    ),
    findUserToLogin: jest.fn((email: string) =>
      mockUsersService.users.find((u) => u.email === email),
    ),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        DtoGeneratorService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    generate = module
      .get<DtoGeneratorService>(DtoGeneratorService)
      .generate.bind(module.get<DtoGeneratorService>(DtoGeneratorService));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should return registered user', async () => {
      const { email, password } = generate(RegisterDto);
      const user = await service.register({ email, password });
      expect(user).toBeDefined();
      expect(user).toEqual({ email, id: expect.any(Number) });
    });

    it('should return registered user with optional fields', async () => {
      const { email, password, firstName, lastName } = generate(
        RegisterDto,
        true,
      );
      const user = await service.register({
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
      });
    });

    it('should hash password when registering', async () => {
      const { email, password } = generate(RegisterDto);
      await service.register({ email, password });
      expect(mockUsersService.addUser).not.toHaveBeenLastCalledWith(
        email,
        password,
        undefined,
        undefined,
      );
    });
  });

  describe('validateUser', () => {
    it('should return user if user exists and password matches', async () => {
      const { email, password } = generate(RegisterDto);
      await service.register({ email, password });
      const user = await service.validateUser({ email, password });
      expect(user).toBeDefined();
      expect(user).toEqual({ email, id: expect.any(Number) });
    });

    it("should return null if user exists and password doesn't match", async () => {
      const { email, password } = generate(RegisterDto);
      await service.register({ email, password });
      const user = await service.validateUser({ email, password: '123' });
      expect(user).toBeNull();
    });

    it('should return null if user does not exist', async () => {
      const { email, password } = generate(RegisterDto);
      const user = await service.validateUser({ email, password });
      expect(user).toBeNull();
    });
  });
});
