import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Setting } from './models/setting.entity';
import { SettingsExporter } from './settings.exporter';
import { SettingsImporter } from './settings.importer';

@Module({
  imports: [TypeOrmModule.forFeature([Setting])],
  providers: [SettingsService, SettingsExporter, SettingsImporter],
  controllers: [SettingsController],
  exports: [SettingsService, SettingsExporter, SettingsImporter],
})
export class SettingsModule {}
