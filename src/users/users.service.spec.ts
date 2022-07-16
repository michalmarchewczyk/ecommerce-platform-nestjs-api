import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { QueryFailedError } from 'typeorm';
import { Role } from './entities/role.enum';
import { DtoGeneratorService } from '../../test/utils/dto-generator/dto-generator.service';
import { RegisterDto } from '../auth/dto/register.dto';
import { UserUpdateDto } from './dto/user-update.dto';

describe('UsersService', () => {
  let service: UsersService;
  let generate: DtoGeneratorService['generate'];

  const mockUsersRepository = {
    users: [],
    save(user: User): User {
      const foundUser = this.users.find((u) => u.email === user.email);
      if (foundUser && foundUser.id !== user.id) {
        throw new QueryFailedError('', [], '');
      }
      this.users.push({ ...user, id: Date.now(), role: Role.Customer });
      return { ...user, id: Date.now() } as User;
    },
    find(): User[] {
      return this.users;
    },
    delete(where: { id: number }): void {
      this.users = this.users.filter((u) => u.id !== where.id);
    },
    findOne(options: {
      where: { id?: number; email?: string };
      select: { password?: boolean };
    }) {
      const user = this.users.find((u) => {
        if (options.where.id) {
          return u.id === options.where.id;
        }
        if (options.where.email) {
          return u.email === options.where.email;
        }
        return null;
      });
      if (!user) {
        return null;
      }
      if (options.select?.password) {
        return { ...user };
      } else {
        return { ...user, password: undefined };
      }
    },
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepository,
        },
        DtoGeneratorService,
      ],
    }).compile();

    mockUsersRepository.users = [];
    service = module.get<UsersService>(UsersService);
    generate = module
      .get<DtoGeneratorService>(DtoGeneratorService)
      .generate.bind(module.get<DtoGeneratorService>(DtoGeneratorService));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addUser', () => {
    it('should return created user', async () => {
      const { email, password } = generate(RegisterDto);
      const user = await service.addUser(email, password);
      expect(user).toBeDefined();
      expect(user).toEqual({ email, id: expect.any(Number) });
    });

    it('should return created user with optional fields', async () => {
      const { email, password, firstName, lastName } = generate(
        RegisterDto,
        true,
      );
      const user = await service.addUser(email, password, firstName, lastName);
      expect(user).toBeDefined();
      expect(user).toEqual({
        email,
        firstName,
        lastName,
        id: expect.any(Number),
      });
    });

    it('should hide password when creating user', async () => {
      const { email, password } = generate(RegisterDto);
      const user = await service.addUser(email, password);
      expect(user).toBeDefined();
      expect(user.password).toBeUndefined();
    });

    it('should throw error when attempting to create user with used email', async () => {
      const { email, password } = generate(RegisterDto);
      await service.addUser(email, password);
      await expect(service.addUser(email, password)).rejects.toThrowError(
        QueryFailedError,
      );
    });
  });

  describe('findUserToLogin', () => {
    it('should return user with given email', async () => {
      const { email, password } = generate(RegisterDto);
      await service.addUser(email, password);
      const user = await service.findUserToLogin(email);
      expect(user).toBeDefined();
      expect(user.email).toEqual(email);
      expect(user.password).toBeDefined();
    });

    it('should return null when user with given email does not exist', async () => {
      const { email } = generate(RegisterDto);
      const user = await service.findUserToLogin(email);
      expect(user).toBeNull();
    });
  });

  describe('findUserToSession', () => {
    it('should return user with given id', async () => {
      const { email, password } = generate(RegisterDto);
      const { id } = await service.addUser(email, password);
      const user = await service.findUserToSession(id);
      expect(user).toBeDefined();
      expect(user.email).toEqual(email);
      expect(user.password).toBeUndefined();
    });

    it('should return null when user with given id does not exist', async () => {
      const user = await service.findUserToSession(12345);
      expect(user).toBeNull();
    });
  });

  describe('getUsers', () => {
    it('should return all users', async () => {
      const users = await service.getUsers();
      expect(users).toBeDefined();
      expect(users).toEqual(mockUsersRepository.users);
    });
  });

  describe('getUser', () => {
    it('should return user with given id', async () => {
      const { email, password } = generate(RegisterDto);
      const { id } = await service.addUser(email, password);
      const user = await service.getUser(id);
      expect(user).toBeDefined();
      expect(user).toEqual({
        email,
        id: expect.any(Number),
        role: Role.Customer,
        firstName: undefined,
        lastName: undefined,
        password: undefined,
      });
    });

    it('should return null when user with given id does not exist', async () => {
      const user = await service.getUser(12345);
      expect(user).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should return updated user', async () => {
      const { email, password } = generate(RegisterDto);
      const { id } = await service.addUser(email, password);
      const updateData = generate(UserUpdateDto, true);
      const updated = await service.updateUser(id, updateData);
      expect(updated).toBeDefined();
      expect(updated).toEqual({
        id: expect.any(Number),
        password: undefined,
        ...updateData,
      });
    });

    it('should return null when user with given id does not exist', async () => {
      const updatedUser = await service.updateUser(12345, {});
      expect(updatedUser).toBeNull();
    });
  });

  describe('deleteUser', () => {
    it('should delete user', async () => {
      const { email, password } = generate(RegisterDto);
      const { id } = await service.addUser(email, password);
      const deleted = await service.deleteUser(id);
      const user = await service.getUser(id);
      expect(deleted).toBeTruthy();
      expect(user).toBeNull();
      expect(
        mockUsersRepository.users.find((u) => u.id === id),
      ).toBeUndefined();
    });

    it('should return false when user with given id does not exist', async () => {
      const deleted = await service.deleteUser(12345);
      expect(deleted).toBeFalsy();
    });
  });
});
