import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as argon2 from 'argon2';
import { User } from '../users/user.entity';
import { RegisterDto } from './register.dto';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async register(registerDto: RegisterDto): Promise<User> {
    const hashedPassword = await argon2.hash(registerDto.password);
    return this.usersService.addUser(
      registerDto.email,
      hashedPassword,
      registerDto.firstName,
      registerDto.lastName,
    );
  }
}
