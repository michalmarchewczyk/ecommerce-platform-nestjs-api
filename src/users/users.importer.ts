import { Injectable } from '@nestjs/common';
import { Importer } from '../import-export/models/importer.interface';
import { Collection } from '../import-export/models/collection.type';
import { User } from './models/user.entity';
import { ParseError } from '../errors/parse.error';
import { UsersService } from './users.service';
import { Role } from './models/role.enum';
import { IdMap } from '../import-export/models/id-map.type';

@Injectable()
export class UsersImporter implements Importer {
  constructor(private usersService: UsersService) {}

  async import(users: Collection): Promise<IdMap> {
    const parsedUsers = this.parseUsers(users);
    const idMap: IdMap = {};
    for (const user of parsedUsers) {
      const found = await this.usersService.findUserByEmail(user.email);
      if (found) {
        idMap[user.id] = found.id;
      } else {
        const { id: newId } = await this.usersService.addUser(
          user.email,
          '',
          user.firstName,
          user.lastName,
        );
        await this.usersService.updateUser(newId, { role: user.role });
        idMap[user.id] = newId;
      }
    }
    return idMap;
  }

  async clear() {
    const users = await this.usersService.getUsers();
    let deleted = 0;
    for (const user of users) {
      if (user.role === Role.Admin) {
        continue;
      }
      await this.usersService.deleteUser(user.id);
      deleted += 1;
    }
    return deleted;
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
      parsedUser.id = user.id as number;
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
