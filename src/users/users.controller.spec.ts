import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './models/user.entity';
import { UserUpdateDto } from './dto/user-update.dto';
import { DtoGeneratorService } from '../../test/utils/dto-generator/dto-generator.service';
import { RepositoryMockService } from '../../test/utils/repository-mock/repository-mock.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RegisterDto } from '../auth/dto/register.dto';
import { NotFoundError } from '../errors/not-found.error';

describe('UsersController', () => {
  let controller: UsersController;
  let mockUsersRepository: RepositoryMockService<User>;
  let testUser: User;
  let generate: DtoGeneratorService['generate'];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        RepositoryMockService.getProvider(User),
        DtoGeneratorService,
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    generate = module
      .get<DtoGeneratorService>(DtoGeneratorService)
      .generate.bind(module.get<DtoGeneratorService>(DtoGeneratorService));
    mockUsersRepository = module.get(getRepositoryToken(User));
    testUser = new User();
    testUser.email = generate(RegisterDto).email;
    testUser.password = generate(RegisterDto).password;
    testUser = mockUsersRepository.save(testUser);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCurrentUser', () => {
    it('should return the current user', async () => {
      const user = await controller.getCurrentUser({ id: testUser.id } as User);
      expect(user).toBeDefined();
      expect(user).toEqual(
        mockUsersRepository.findOne({ where: { id: testUser.id } }),
      );
    });
  });

  describe('getUsers', () => {
    it('should return all users', async () => {
      const users = await controller.getUsers();
      expect(users).toBeDefined();
      expect(users).toEqual(mockUsersRepository.find());
    });
  });

  describe('getUser', () => {
    it('should return a user', async () => {
      const user = await controller.getUser(testUser.id);
      expect(user).toBeDefined();
      expect(user).toEqual(
        mockUsersRepository.findOne({ where: { id: testUser.id } }),
      );
    });
  });

  describe('updateUser', () => {
    it('should update a user', async () => {
      const updateData = generate(UserUpdateDto, true);
      const updated = await controller.updateUser(testUser.id, updateData);
      expect(updated).toBeDefined();
      expect(updated).toEqual({
        id: testUser.id,
        ...updateData,
        registered: testUser.registered,
      });
    });

    it('should throw an error if user does not exist', async () => {
      await expect(controller.updateUser(12345, {})).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      await controller.deleteUser(testUser.id);
      expect(mockUsersRepository.find()).toEqual([]);
    });

    it('should throw an error if user does not exist', async () => {
      await expect(controller.deleteUser(12345)).rejects.toThrow(NotFoundError);
    });
  });
});
