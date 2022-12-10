import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './models/user.entity';
import { UsersExporter } from './users.exporter';
import { UsersImporter } from './users.importer';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService, UsersExporter, UsersImporter],
  exports: [UsersService, UsersExporter, UsersImporter],
})
export class UsersModule {}
