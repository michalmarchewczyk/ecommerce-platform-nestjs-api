import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as argon2 from 'argon2';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async register(registerDto: RegisterDto): Promise<User> {
    const hashedPassword = await argon2.hash(registerDto.password);
    return await this.usersService.addUser(
      registerDto.email,
      hashedPassword,
      registerDto.firstName,
      registerDto.lastName,
    );
  }

  async validateUser(loginDto: LoginDto): Promise<User | null> {
    const user = await this.usersService.findUserToLogin(loginDto.email);
    if (!user) {
      return null;
    }
    const passwordMatches = await argon2.verify(
      user.password,
      loginDto.password,
    );
    if (!passwordMatches) {
      return null;
    }
    user.password = undefined;
    return user;
  }
}
