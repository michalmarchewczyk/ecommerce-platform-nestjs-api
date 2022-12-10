import { Module } from '@nestjs/common';
import { PagesController } from './pages.controller';
import { PagesService } from './pages.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Page } from './models/page.entity';
import { PageGroup } from './models/page-group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Page, PageGroup])],
  controllers: [PagesController],
  providers: [PagesService],
})
export class PagesModule {}
