import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as argon2 from 'argon2';
import { User } from '../users/user.entity';
import { RegisterDto } from './register.dto';
import { QueryFailedError } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async register(registerDto: RegisterDto): Promise<User> {
    const hashedPassword = await argon2.hash(registerDto.password);
    try {
      return await this.usersService.addUser(
        registerDto.email,
        hashedPassword,
        registerDto.firstName,
        registerDto.lastName,
      );
    } catch (e) {
      if (e instanceof QueryFailedError) {
        throw new ConflictException(['user already exists']);
      } else {
        throw new InternalServerErrorException(['could not add user']);
      }
    }
  }
}
