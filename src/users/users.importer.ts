import { Injectable } from '@nestjs/common';
import { Importer } from '../import-export/models/importer.interface';
import { Collection } from '../import-export/models/collection.type';
import { User } from './models/user.entity';
import { ParseError } from '../errors/parse.error';
import { UsersService } from './users.service';
import { Role } from './models/role.enum';

@Injectable()
export class UsersImporter implements Importer {
  constructor(private usersService: UsersService) {}

  async import(users: Collection): Promise<boolean> {
    const parsedUsers = this.parseUsers(users);
    for (const user of parsedUsers) {
      // TODO: handle conflicts
      const { id } = await this.usersService.addUser(
        user.email,
        '',
        user.firstName,
        user.lastName,
      );
      await this.usersService.updateUser(id, { role: user.role });
    }
    return true;
  }

  private parseUsers(users: Collection) {
    const parsedUsers: User[] = [];
    for (const user of users) {
      parsedUsers.push(this.parseUser(user));
    }
    return parsedUsers;
  }

  private parseUser(user: Collection[number]) {
    const parsedUser = new User();
    try {
      parsedUser.email = user.email as string;
      parsedUser.role = user.role as Role;
      parsedUser.firstName = user.firstName as string;
      parsedUser.lastName = user.lastName as string;
    } catch (e) {
      throw new ParseError('user');
    }
    return parsedUser;
  }
}
