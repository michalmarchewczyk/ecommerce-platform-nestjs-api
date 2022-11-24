import { PassportSerializer } from '@nestjs/passport';
import { User } from '../users/models/user.entity';
import { UsersService } from '../users/users.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LocalSerializer extends PassportSerializer {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  serializeUser(user: User, done: CallableFunction) {
    done(null, user.id.toString(10));
  }

  async deserializeUser(id: string, done: CallableFunction) {
    const user = await this.usersService.findUserToSession(parseInt(id, 10));
    done(null, user);
  }
}
