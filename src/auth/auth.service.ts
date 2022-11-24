import { Injectable, OnModuleInit } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as argon2 from 'argon2';
import { User } from '../users/models/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { Role } from '../users/models/role.enum';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private usersService: UsersService,
    private config: ConfigService,
  ) {}

  async onModuleInit() {
    await this.addAdminUser();
  }

  async addAdminUser(): Promise<void> {
    try {
      const user = await this.register({
        email: this.config.get('admin.email', ''),
        password: this.config.get('admin.password', ''),
      });
      await this.usersService.updateUser(user.id, { role: Role.Admin });
    } catch (e) {
      // do nothing
    }
  }

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
    const { password, ...toReturn } = user;
    return toReturn as User;
  }
}
