import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/entities/user.entity';
import { LocalAuthGuard } from './local-auth.guard';
import { SessionAuthGuard } from './session-auth.guard';
import { Request } from 'express';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiCreatedResponse({ type: User, description: 'Registered user' })
  @ApiBadRequestResponse({ description: 'Invalid register data' })
  @ApiConflictResponse({ description: 'User with given email already exists' })
  async register(@Body() registerDto: RegisterDto): Promise<User> {
    return this.authService.register(registerDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiBody({ type: LoginDto })
  @ApiCreatedResponse({ type: User, description: 'Logged in user' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(@Req() req: Request): Promise<User> {
    return req.user as User;
  }

  @UseGuards(SessionAuthGuard)
  @Post('logout')
  @ApiCreatedResponse({ description: 'User logged out' })
  @ApiUnauthorizedResponse({ description: 'User is not logged in' })
  async logout(@Req() req: Request): Promise<void> {
    req.logOut(() => {
      req.session.cookie.maxAge = 0;
    });
  }
}
