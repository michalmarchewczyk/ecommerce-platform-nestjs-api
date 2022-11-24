import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../../src/users/models/user.entity';
import { TestUsersService } from './test-users.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [TestUsersService],
  exports: [TestUsersService],
})
export class TestUsersModule {}
