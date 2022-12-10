import { Injectable } from '@nestjs/common';
import { Importer } from '../import-export/models/importer.interface';
import { Collection } from '../import-export/models/collection.type';
import { ParseError } from '../errors/parse.error';
import { IdMap } from '../import-export/models/id-map.type';
import { PagesService } from './pages.service';
import { Page } from './models/page.entity';
import { PageGroup } from './models/page-group.entity';

@Injectable()
export class PagesImporter implements Importer {
  constructor(private pagesService: PagesService) {}

  async import(pages: Collection): Promise<IdMap> {
    const parsedPages = this.parsePages(pages);
    const idMap: IdMap = {};
    for (const page of parsedPages) {
      const { id, ...createDto } = page;
      const { id: newId } = await this.pagesService.createPage(createDto);
      idMap[page.id] = newId;
    }
    for (const page of parsedPages) {
      await this.pagesService.updatePage(idMap[page.id], {
        groups: page.groups,
      });
    }
    return idMap;
  }

  async clear() {
    const pages = await this.pagesService.getPages();
    let deleted = 0;
    for (const page of pages) {
      await this.pagesService.deletePage(page.id);
      deleted += 1;
    }
    return deleted;
  }

  private parsePages(pages: Collection) {
    const parsedPages: Page[] = [];
    for (const page of pages) {
      parsedPages.push(this.parsePage(page));
    }
    return parsedPages;
  }

  private parsePage(page: Collection[number]) {
    const parsedPage = new Page();
    try {
      parsedPage.id = page.id as number;
      parsedPage.title = page.title as string;
      parsedPage.content = page.content as string;
      parsedPage.slug = page.slug as string;
      if (typeof page.groups === 'string') {
        page.groups = JSON.parse(page.groups);
      }
      parsedPage.groups = (page.groups as Collection).map((group) =>
        this.parsePageGroup(group),
      );
    } catch (e) {
      throw new ParseError('page');
    }
    return parsedPage;
  }

  private parsePageGroup(group: Collection[number]) {
    const parsedGroup = new PageGroup();
    try {
      parsedGroup.name = group.name as string;
    } catch (e) {
      throw new ParseError('page group');
    }
    return parsedGroup;
  }
}
