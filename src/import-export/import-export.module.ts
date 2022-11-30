import { Module } from '@nestjs/common';
import { ImportController } from './import.controller';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { ImportService } from './import.service';
import { SettingsModule } from '../settings/settings.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [SettingsModule, UsersModule],
  controllers: [ExportController, ImportController],
  providers: [ExportService, ImportService],
})
export class ImportExportModule {}
