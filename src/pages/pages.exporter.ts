import { Injectable } from '@nestjs/common';
import { Exporter } from '../import-export/models/exporter.interface';
import { Page } from './models/page.entity';
import { PagesService } from './pages.service';

@Injectable()
export class PagesExporter implements Exporter<Page> {
  constructor(private pagesService: PagesService) {}

  async export(): Promise<Page[]> {
    const pages = await this.pagesService.getPages();
    const preparedPages: Page[] = [];
    for (const page of pages) {
      preparedPages.push(this.preparePage(page));
    }
    return preparedPages;
  }

  private preparePage(page: Page) {
    const preparedPage = new Page() as any;
    preparedPage.id = page.id;
    preparedPage.title = page.title;
    preparedPage.content = page.content;
    preparedPage.slug = page.slug;
    preparedPage.groups = page.groups.map(({ name }) => ({ name }));
    return preparedPage;
  }
}
