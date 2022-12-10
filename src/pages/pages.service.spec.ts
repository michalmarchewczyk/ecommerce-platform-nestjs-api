import { Test, TestingModule } from '@nestjs/testing';
import { PagesService } from './pages.service';
import { RepositoryMockService } from '../../test/utils/repository-mock/repository-mock.service';
import { Page } from './models/page.entity';
import { PageGroup } from './models/page-group.entity';

describe('PagesService', () => {
  let service: PagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PagesService,
        RepositoryMockService.getProvider(Page),
        RepositoryMockService.getProvider(PageGroup),
      ],
    }).compile();

    service = module.get<PagesService>(PagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
