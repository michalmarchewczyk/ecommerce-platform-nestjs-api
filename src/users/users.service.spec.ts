import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { QueryFailedError } from 'typeorm';

describe('UsersService', () => {
  let service: UsersService;
  let mockUsersRepository: User[];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            save: jest.fn((user: User) => {
              if (mockUsersRepository.find((u) => u.email === user.email)) {
                throw new QueryFailedError('', [], '');
              }
              mockUsersRepository.push(user);
              return user;
            }),
          },
        },
      ],
    }).compile();

    mockUsersRepository = [];
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return created user', async () => {
    const email = 'test@test.local';
    const password = 'test';
    const user = await service.addUser(email, password);
    expect(user).toBeDefined();
    expect(user).toBeInstanceOf(User);
    expect(user).toEqual({ email });
  });

  it('should return created user with optional fields', async () => {
    const email = 'test@test.local';
    const password = 'test';
    const firstName = 'Test';
    const lastName = 'User';
    const user = await service.addUser(email, password, firstName, lastName);
    expect(user).toBeDefined();
    expect(user).toBeInstanceOf(User);
    expect(user).toEqual({ email, firstName, lastName });
  });

  it('should hide password when creating user', async () => {
    const email = 'test@test.local';
    const password = 'test';
    const user = await service.addUser(email, password);
    expect(user).toBeDefined();
    expect(user).toBeInstanceOf(User);
    expect(user.password).toBeUndefined();
  });

  it('should throw error when attempting to create user with used email', async () => {
    const email = 'test@test.local';
    const password = 'test';
    await service.addUser(email, password);
    await expect(service.addUser(email, password)).rejects.toThrowError(
      QueryFailedError,
    );
  });
});
