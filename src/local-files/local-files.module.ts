import { Module } from '@nestjs/common';
import { LocalFilesService } from './local-files.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SettingsModule],
  providers: [LocalFilesService],
  exports: [LocalFilesService],
})
export class LocalFilesModule {}
