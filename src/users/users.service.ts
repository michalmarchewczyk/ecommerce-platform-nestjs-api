import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { User } from './user.entity';

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
    try {
      const savedUser = await this.usersRepository.save(user);
      savedUser.password = undefined;
      return savedUser;
    } catch (e) {
      if (e instanceof QueryFailedError) {
        throw new ConflictException('User already exists');
      } else {
        throw new InternalServerErrorException('Could not add user');
      }
    }
  }
}
