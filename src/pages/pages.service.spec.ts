import { Test, TestingModule } from '@nestjs/testing';
import { PagesService } from './pages.service';
import { RepositoryMockService } from '../../test/utils/repository-mock/repository-mock.service';
import { Page } from './models/page.entity';
import { PageGroup } from './models/page-group.entity';
import { DtoGeneratorService } from '../../test/utils/dto-generator/dto-generator.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PageCreateDto } from './dto/page-create.dto';
import { PageUpdateDto } from './dto/page-update.dto';

describe('PagesService', () => {
  let service: PagesService;
  let generate: DtoGeneratorService['generate'];
  let mockPagesRepository: RepositoryMockService<Page>;
  let mockPageGroupsRepository: RepositoryMockService<PageGroup>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PagesService,
        RepositoryMockService.getProvider(Page),
        RepositoryMockService.getProvider(PageGroup),
        DtoGeneratorService,
      ],
    }).compile();

    service = module.get<PagesService>(PagesService);
    generate = module
      .get<DtoGeneratorService>(DtoGeneratorService)
      .generate.bind(module.get<DtoGeneratorService>(DtoGeneratorService));
    mockPagesRepository = module.get(getRepositoryToken(Page));
    mockPageGroupsRepository = module.get(getRepositoryToken(PageGroup));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPages', () => {
    it('should return all pages', async () => {
      const pages = await service.getPages();
      expect(pages).toEqual(mockPagesRepository.entities);
    });
  });

  describe('getPageGroups', () => {
    it('should return all page groups', async () => {
      const pageGroups = await service.getPageGroups();
      expect(pageGroups).toEqual(mockPageGroupsRepository.entities);
    });
  });

  describe('getPage', () => {
    it('should return a page', async () => {
      const createData = generate(PageCreateDto);
      const { id } = mockPagesRepository.save(createData);
      const page = await service.getPage(id);
      expect(page).toEqual(
        mockPagesRepository.entities.find((p) => p.id === id),
      );
    });

    it('should throw error if page not found', async () => {
      await expect(service.getPage(12345)).rejects.toThrowError();
    });
  });

  describe('createPage', () => {
    it('should create a page', async () => {
      const createData = generate(PageCreateDto, true);
      const created = await service.createPage(createData);
      expect(created).toEqual({
        id: expect.any(Number),
        ...createData,
        created: expect.any(Date),
        updated: expect.any(Date),
        groups: [],
      });
      expect(
        mockPagesRepository.entities.find((p) => p.id === created.id),
      ).toEqual({
        id: created.id,
        ...createData,
        created: expect.any(Date),
        updated: expect.any(Date),
        groups: [],
      });
    });
  });

  describe('updatePage', () => {
    it('should update a page', async () => {
      const createData = generate(PageCreateDto);
      const { id } = mockPagesRepository.save(createData);
      const updateData = generate(PageUpdateDto, true);
      updateData.groups = [{ name: 'test group' }];
      const updated = await service.updatePage(id, updateData);
      expect(updated).toEqual({
        id,
        ...updateData,
        created: expect.any(Date),
        updated: expect.any(Date),
        groups: [
          {
            id: expect.any(Number),
            name: 'test group',
            pages: [],
          },
        ],
      });
      expect(mockPagesRepository.entities.find((p) => p.id === id)).toEqual({
        id,
        ...updateData,
        created: expect.any(Date),
        updated: expect.any(Date),
        groups: [
          {
            id: expect.any(Number),
            name: 'test group',
            pages: [],
          },
        ],
      });
    });

    it('should throw error if page not found', async () => {
      await expect(service.updatePage(12345, {})).rejects.toThrowError();
    });
  });

  describe('deletePage', () => {
    it('should delete a page', async () => {
      const createData = generate(PageCreateDto);
      const { id } = mockPagesRepository.save(createData);
      const deleted = await service.deletePage(id);
      expect(deleted).toBe(true);
      expect(
        mockPagesRepository.entities.find((p) => p.id === id),
      ).toBeUndefined();
    });

    it('should throw error if page not found', async () => {
      await expect(service.deletePage(12345)).rejects.toThrowError();
    });
  });
});
