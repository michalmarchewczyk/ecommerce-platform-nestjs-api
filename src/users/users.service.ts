import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserUpdateDto } from './dto/user-update.dto';

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
    const user = new User();
    user.email = email;
    user.password = hashedPassword;
    user.firstName = firstName;
    user.lastName = lastName;
    const savedUser = await this.usersRepository.save(user);
    savedUser.password = undefined;
    return savedUser;
  }

  async findUserToLogin(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { email },
      select: { password: true, email: true, id: true },
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

  async getUser(id: number): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { id },
    });
  }

  async updateUser(id: number, update: UserUpdateDto): Promise<User | null> {
    const user = await this.usersRepository.findOne({
      where: { id },
    });
    if (!user) {
      return null;
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
      return false;
    }
    await this.usersRepository.delete({ id });
    return true;
  }
}
