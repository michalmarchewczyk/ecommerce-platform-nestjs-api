import { Module } from '@nestjs/common';
import { ImportController } from './import.controller';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { ImportService } from './import.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SettingsModule],
  controllers: [ExportController, ImportController],
  providers: [ExportService, ImportService],
})
export class ImportExportModule {}
