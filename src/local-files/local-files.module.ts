import { Module } from '@nestjs/common';
import { LocalFilesController } from './local-files.controller';
import { LocalFilesService } from './local-files.service';
import { ProductPhoto } from '../products/entities/product-photo.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [TypeOrmModule.forFeature([ProductPhoto]), SettingsModule],
  controllers: [LocalFilesController],
  providers: [LocalFilesService],
  exports: [LocalFilesService],
})
export class LocalFilesModule {}
