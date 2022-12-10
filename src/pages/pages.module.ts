import { Module } from '@nestjs/common';
import { PagesController } from './pages.controller';
import { PagesService } from './pages.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Page } from './models/page.entity';
import { PageGroup } from './models/page-group.entity';
import { PagesExporter } from './pages.exporter';
import { PagesImporter } from './pages.importer';

@Module({
  imports: [TypeOrmModule.forFeature([Page, PageGroup])],
  controllers: [PagesController],
  providers: [PagesService, PagesExporter, PagesImporter],
  exports: [PagesExporter, PagesImporter],
})
export class PagesModule {}
