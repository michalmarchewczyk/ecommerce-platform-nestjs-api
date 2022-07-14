import { Module } from '@nestjs/common';
import { LocalFilesController } from './local-files.controller';
import { LocalFilesService } from './local-files.service';
import { ProductPhoto } from '../products/entities/product-photo.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([ProductPhoto])],
  controllers: [LocalFilesController],
  providers: [LocalFilesService],
})
export class LocalFilesModule {}
