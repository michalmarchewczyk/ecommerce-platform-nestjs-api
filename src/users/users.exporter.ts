import { Injectable } from '@nestjs/common';
import { Exporter } from '../import-export/models/exporter.interface';
import { User } from './models/user.entity';
import { UsersService } from './users.service';

@Injectable()
export class UsersExporter implements Exporter<User> {
  constructor(private usersService: UsersService) {}

  async export(): Promise<User[]> {
    const users = await this.usersService.getUsers();
    const preparedUsers: User[] = [];
    for (const user of users) {
      preparedUsers.push(this.prepareUser(user));
    }
    return preparedUsers;
  }

  private prepareUser(user: User) {
    const preparedUser = new User();
    preparedUser.id = user.id;
    preparedUser.email = user.email;
    preparedUser.role = user.role;
    preparedUser.firstName = user.firstName;
    preparedUser.lastName = user.lastName;
    return preparedUser;
  }
}
