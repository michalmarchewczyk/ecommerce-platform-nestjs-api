import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserUpdateDto } from './dto/user-update.dto';
import { Role } from './entities/role.enum';
import { NotFoundException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  const mockUsersService = {
    users: [
      {
        id: 1,
        email: 'test@test.local',
        role: Role.Customer,
      },
    ],
    getUser(id: number): User {
      return this.users.find((u) => u.id === id);
    },
    getUsers(): User[] {
      return this.users;
    },
    updateUser(id: number, update: UserUpdateDto): User {
      const user = this.users.find((u) => u.id === id);
      if (!user) {
        return null;
      }
      Object.assign(user, update);
      return user;
    },
    deleteUser(id: number): boolean {
      const user = this.users.find((u) => u.id === id);
      if (!user) {
        return false;
      }
      this.users = this.users.filter((u) => u.id !== id);
      return true;
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCurrentUser', () => {
    it('should return the current user', async () => {
      const user = await controller.getCurrentUser({ user: { id: 1 } });
      expect(user).toBeDefined();
      expect(user).toEqual(mockUsersService.users[0]);
    });
  });

  describe('getUsers', () => {
    it('should return all users', async () => {
      const users = await controller.getUsers();
      expect(users).toBeDefined();
      expect(users).toEqual(mockUsersService.users);
    });
  });

  describe('getUser', () => {
    it('should return a user', async () => {
      const user = await controller.getUser(1);
      expect(user).toBeDefined();
      expect(user).toEqual(mockUsersService.users[0]);
    });
  });

  describe('updateUser', () => {
    it('should update a user', async () => {
      const updatedUser = await controller.updateUser(1, {
        email: 'test2@test.local',
        role: Role.Admin,
        firstName: 'Test',
        lastName: 'User',
      });
      expect(updatedUser).toBeDefined();
      expect(updatedUser).toEqual({
        id: 1,
        email: 'test2@test.local',
        role: Role.Admin,
        firstName: 'Test',
        lastName: 'User',
      });
    });

    it('should throw an error if user does not exist', async () => {
      await expect(controller.updateUser(12345, {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      await controller.deleteUser(1);
      expect(mockUsersService.users).toEqual([]);
    });

    it('should throw an error if user does not exist', async () => {
      await expect(controller.deleteUser(12345)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
