import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../../src/users/models/user.entity';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Role } from '../../../src/users/models/role.enum';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';

@Injectable()
export class TestUsersService {
  private static users: User[] = [];

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {
    if (this.configService.get<string>('nodeEnv') !== 'test') {
      throw new Error(
        'Test users service can only be used in test environment',
      );
    }
  }

  async init(): Promise<void> {
    await this.createUser('customer', Role.Customer);
    await this.createUser('sales', Role.Sales);
    await this.createUser('manager', Role.Manager);
    await this.createUser('admin', Role.Admin);
    await this.createUser('disabled', Role.Disabled);
  }

  async createUser(name: string, role: Role): Promise<void> {
    const user = new User();
    user.email = `${name}@test.local`;
    user.password = await argon2.hash('test1234');
    user.role = role;
    TestUsersService.users.push({ ...user, password: 'test1234' });
    try {
      await this.usersRepository.upsert(user, ['email']);
    } catch (e) {
      return;
    }
  }

  getCredentials(role: Role): { email: string; password: string } {
    const user = TestUsersService.users.find((u) => u.role === role);
    if (!user) {
      throw new Error(`No test user with role ${role}`);
    }
    return { email: user.email, password: user.password };
  }
}
