import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './models/user.entity';
import { UserUpdateDto } from './dto/user-update.dto';
import { NotFoundError } from '../errors/not-found.error';
import { ConflictError } from '../errors/conflict.error';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {}

  async addUser(
    email: string,
    hashedPassword: string,
    firstName?: string,
    lastName?: string,
  ): Promise<User> {
    try {
      const user = new User();
      user.email = email;
      user.password = hashedPassword;
      user.firstName = firstName;
      user.lastName = lastName;
      const savedUser = await this.usersRepository.save(user);
      const { password, ...toReturn } = savedUser;
      return toReturn as User;
    } catch (error) {
      throw new ConflictError('user', 'email', email);
    }
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { email },
    });
  }

  async findUserToLogin(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { email },
      select: { password: true, email: true, id: true, role: true },
    });
  }

  async findUserToSession(id: number): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { id },
      select: { email: true, id: true, role: true },
    });
  }

  async getUsers(): Promise<User[]> {
    return await this.usersRepository.find();
  }

  async getUser(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundError('user', 'id', id.toString());
    }
    return user;
  }

  async updateUser(id: number, update: UserUpdateDto): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundError('user', 'id', id.toString());
    }
    Object.assign(user, update);
    await this.usersRepository.save(user);
    return user;
  }

  async deleteUser(id: number): Promise<boolean> {
    const user = await this.usersRepository.findOne({
      where: { id },
    });
    if (!user) {
      throw new NotFoundError('user', 'id', id.toString());
    }
    await this.usersRepository.delete({ id });
    return true;
  }
}
