import { Test, TestingModule } from '@nestjs/testing';
import { PagesController } from './pages.controller';
import { PagesService } from './pages.service';
import { RepositoryMockService } from '../../test/utils/repository-mock/repository-mock.service';
import { Page } from './models/page.entity';
import { PageGroup } from './models/page-group.entity';

describe('PagesController', () => {
  let controller: PagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PagesController],
      providers: [
        PagesService,
        RepositoryMockService.getProvider(Page),
        RepositoryMockService.getProvider(PageGroup),
      ],
    }).compile();

    controller = module.get<PagesController>(PagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
