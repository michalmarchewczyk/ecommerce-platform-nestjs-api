import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { QueryFailedError } from 'typeorm';

describe('UsersService', () => {
  let service: UsersService;
  const mockUsersRepository = {
    users: [],
    save(user: User): User {
      if (this.users.find((u) => u.email === user.email)) {
        throw new QueryFailedError('', [], '');
      }
      this.users.push({ ...user, id: Date.now() });
      return { ...user, id: Date.now() } as User;
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
      if (options.select.password) {
        return { ...user };
      } else {
        return { ...user, password: undefined };
      }
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    mockUsersRepository.users = [];
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addUser', () => {
    it('should return created user', async () => {
      const email = 'test@test.local';
      const password = 'test';
      const user = await service.addUser(email, password);
      expect(user).toBeDefined();
      expect(user).toEqual({ email, id: expect.any(Number) });
    });

    it('should return created user with optional fields', async () => {
      const email = 'test2@test.local';
      const password = 'test';
      const firstName = 'Test';
      const lastName = 'User';
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
      const email = 'test3@test.local';
      const password = 'test';
      const user = await service.addUser(email, password);
      expect(user).toBeDefined();
      expect(user.password).toBeUndefined();
    });

    it('should throw error when attempting to create user with used email', async () => {
      const email = 'test4@test.local';
      const password = 'test';
      await service.addUser(email, password);
      await expect(service.addUser(email, password)).rejects.toThrowError(
        QueryFailedError,
      );
    });
  });

  describe('findUserToLogin', () => {
    it('should return user with given email', async () => {
      const email = 'test5@test.local';
      const password = 'test';
      await service.addUser(email, password);
      const user = await service.findUserToLogin(email);
      expect(user).toBeDefined();
      expect(user.email).toEqual(email);
      expect(user.password).toBeDefined();
    });

    it('should return null when user with given email does not exist', async () => {
      const email = 'test123@test.local';
      const user = await service.findUserToLogin(email);
      expect(user).toBeNull();
    });
  });

  describe('findUserById', () => {
    it('should return user with given id', async () => {
      const email = 'test6@test.local';
      const password = 'test';
      const { id } = await service.addUser(email, password);
      const user = await service.findUserById(id);
      expect(user).toBeDefined();
      expect(user.email).toEqual(email);
      expect(user.password).toBeUndefined();
    });

    it('should return null when user with given id does not exist', async () => {
      const user = await service.findUserById(12345);
      expect(user).toBeNull();
    });
  });
});
