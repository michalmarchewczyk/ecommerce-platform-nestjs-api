import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from '../auth/roles.decorator';
import { Role } from './entities/role.enum';
import { User } from './entities/user.entity';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { UserUpdateDto } from './dto/user-update.dto';
import { ReqUser } from '../auth/user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(SessionAuthGuard)
  async getCurrentUser(@ReqUser() user: User): Promise<User> {
    return this.usersService.getUser(user.id);
  }

  @Get()
  @Roles(Role.Admin)
  async getUsers(): Promise<User[]> {
    return this.usersService.getUsers();
  }

  @Get('/:id')
  @Roles(Role.Admin)
  async getUser(@Param('id') id: number): Promise<User> {
    const user = await this.usersService.getUser(id);
    if (!user) {
      throw new NotFoundException(['user not found']);
    }
    return user;
  }

  @Patch('/:id')
  @Roles(Role.Admin)
  async updateUser(
    @Param('id') id: number,
    @Body() update: UserUpdateDto,
  ): Promise<User> {
    const updatedUser = await this.usersService.updateUser(id, update);
    if (!updatedUser) {
      throw new NotFoundException(['user not found']);
    }
    return updatedUser;
  }

  @Delete('/:id')
  @Roles(Role.Admin)
  async deleteUser(@Param('id') id: number): Promise<void> {
    const deleted = await this.usersService.deleteUser(id);
    if (!deleted) {
      throw new NotFoundException(['user not found']);
    }
    return;
  }
}
