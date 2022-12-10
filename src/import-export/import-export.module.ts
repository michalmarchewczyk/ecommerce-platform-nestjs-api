import { Module } from '@nestjs/common';
import { ImportController } from './import.controller';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { ImportService } from './import.service';
import { SettingsModule } from '../settings/settings.module';
import { UsersModule } from '../users/users.module';
import { CatalogModule } from '../catalog/catalog.module';
import { JsonSerializer } from './json-serializer.service';
import { ZipSerializer } from './zip-serializer.service';
import { WishlistsModule } from '../wishlists/wishlists.module';
import { SalesModule } from '../sales/sales.module';
import { PagesModule } from '../pages/pages.module';

@Module({
  imports: [
    SettingsModule,
    PagesModule,
    UsersModule,
    CatalogModule,
    WishlistsModule,
    SalesModule,
  ],
  controllers: [ExportController, ImportController],
  providers: [ExportService, ImportService, JsonSerializer, ZipSerializer],
})
export class ImportExportModule {}
