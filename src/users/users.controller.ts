import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from './models/role.enum';
import { User } from './models/user.entity';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { UserUpdateDto } from './dto/user-update.dto';
import { ReqUser } from '../auth/decorators/user.decorator';
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
@ApiUnauthorizedResponse({ description: 'User is not logged in' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({
    type: User,
    description: 'Currently logged in user',
  })
  async getCurrentUser(@ReqUser() user: User): Promise<User> {
    return this.usersService.getUser(user.id);
  }

  @Get()
  @Roles(Role.Admin)
  @ApiOkResponse({
    type: [User],
    description: 'List of all users',
  })
  @ApiForbiddenResponse({ description: 'User is not admin' })
  async getUsers(): Promise<User[]> {
    return this.usersService.getUsers();
  }

  @Get('/:id')
  @Roles(Role.Admin)
  @ApiOkResponse({
    type: User,
    description: 'User with given id',
  })
  @ApiForbiddenResponse({ description: 'User is not admin' })
  async getUser(@Param('id') id: number): Promise<User> {
    return await this.usersService.getUser(id);
  }

  @Patch('/:id')
  @Roles(Role.Admin)
  @ApiOkResponse({
    type: User,
    description: 'User successfully updated',
  })
  @ApiForbiddenResponse({ description: 'User is not admin' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiBadRequestResponse({ description: 'Invalid update data' })
  async updateUser(
    @Param('id') id: number,
    @Body() update: UserUpdateDto,
  ): Promise<User> {
    return await this.usersService.updateUser(id, update);
  }

  @Delete('/:id')
  @Roles(Role.Admin)
  @ApiOkResponse({
    description: 'User successfully deleted',
  })
  @ApiForbiddenResponse({ description: 'User is not admin' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async deleteUser(@Param('id') id: number): Promise<void> {
    await this.usersService.deleteUser(id);
  }
}
