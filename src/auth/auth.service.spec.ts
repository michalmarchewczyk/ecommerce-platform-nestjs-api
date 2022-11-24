import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { DtoGeneratorService } from '../../test/utils/dto-generator/dto-generator.service';
import { RegisterDto } from './dto/register.dto';
import { RepositoryMockService } from '../../test/utils/repository-mock/repository-mock.service';
import { User } from '../users/models/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Role } from '../users/models/role.enum';
import { ConfigService } from '@nestjs/config';

describe('AuthService', () => {
  let service: AuthService;
  let generate: DtoGeneratorService['generate'];
  let mockUsersRepository: RepositoryMockService<User>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        ConfigService,
        DtoGeneratorService,
        UsersService,
        RepositoryMockService.getProvider(User),
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    generate = module
      .get<DtoGeneratorService>(DtoGeneratorService)
      .generate.bind(module.get<DtoGeneratorService>(DtoGeneratorService));
    mockUsersRepository = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should return registered user', async () => {
      const { email, password } = generate(RegisterDto);
      const user = await service.register({ email, password });
      expect(user).toBeDefined();
      expect(user).toEqual({
        email,
        id: expect.any(Number),
        role: Role.Customer,
        firstName: null,
        lastName: null,
        registered: expect.any(Date),
        password: undefined,
      });
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
        registered: expect.any(Date),
        password: undefined,
        role: Role.Customer,
      });
    });

    it('should hash password when registering', async () => {
      const { email, password } = generate(RegisterDto);
      await service.register({ email, password });
      expect(
        mockUsersRepository.findOne({
          where: { email },
          select: { email: true, password: true },
        }),
      ).toEqual({ email, password: expect.not.stringMatching(password) });
    });
  });

  describe('validateUser', () => {
    it('should return user if user exists and password matches', async () => {
      const { email, password } = generate(RegisterDto);
      await service.register({ email, password });
      const user = await service.validateUser({ email, password });
      expect(user).toBeDefined();
      expect(user).toEqual({
        email,
        id: expect.any(Number),
        role: Role.Customer,
      });
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
