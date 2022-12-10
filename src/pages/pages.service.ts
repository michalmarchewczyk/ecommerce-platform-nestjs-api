import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Page } from './models/page.entity';
import { Repository } from 'typeorm';
import { PageCreateDto } from './dto/page-create.dto';
import { PageUpdateDto } from './dto/page-update.dto';
import { PageGroup } from './models/page-group.entity';
import { NotFoundError } from '../errors/not-found.error';

@Injectable()
export class PagesService {
  constructor(
    @InjectRepository(Page) private pagesRepository: Repository<Page>,
    @InjectRepository(PageGroup)
    private pageGroupsRepository: Repository<PageGroup>,
  ) {}

  async getPages() {
    return this.pagesRepository.find();
  }

  async getPageGroups() {
    return this.pageGroupsRepository.find({ relations: ['pages'] });
  }

  async getPage(id: number) {
    const page = await this.pagesRepository.findOne({
      where: { id },
    });
    if (!page) {
      throw new NotFoundError('page', 'id', id.toString());
    }
    return page;
  }

  async createPage(pageData: PageCreateDto) {
    const page = new Page();
    Object.assign(page, pageData);
    return this.pagesRepository.save(page);
  }

  async updatePage(id: number, pageData: PageUpdateDto) {
    const page = await this.getPage(id);
    Object.assign(page, pageData);
    if (pageData.groups) {
      page.groups = [];
      for (const groupData of pageData.groups) {
        let group = await this.pageGroupsRepository.findOne({
          where: { name: groupData.name },
        });
        if (!group) {
          group = new PageGroup();
          group.name = groupData.name;
          group = await this.pageGroupsRepository.save(group);
        }
        page.groups.push(group);
      }
    }
    return this.pagesRepository.save(page);
  }

  async deletePage(id: number) {
    await this.getPage(id);
    await this.pagesRepository.delete({ id });
    return true;
  }
}
