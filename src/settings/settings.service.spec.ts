import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from './settings.service';
import { DtoGeneratorService } from '../../test/utils/dto-generator/dto-generator.service';
import { RepositoryMockService } from '../../test/utils/repository-mock/repository-mock.service';
import { Setting } from './models/setting.entity';
import { SettingCreateDto } from './dto/setting-create.dto';
import { NotFoundError } from '../errors/not-found.error';
import { SettingUpdateDto } from './dto/setting-update.dto';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SettingType } from './models/setting-type.enum';

describe('SettingsService', () => {
  let service: SettingsService;
  let generate: DtoGeneratorService['generate'];
  let mockSettingsRepository: RepositoryMockService<Setting>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        RepositoryMockService.getProvider(Setting),
        DtoGeneratorService,
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
    generate = module
      .get<DtoGeneratorService>(DtoGeneratorService)
      .generate.bind(module.get<DtoGeneratorService>(DtoGeneratorService));
    mockSettingsRepository = module.get(getRepositoryToken(Setting));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSettings', () => {
    it('should return all settings', async () => {
      expect(await service.getSettings()).toEqual(
        mockSettingsRepository.entities,
      );
    });
  });

  describe('getSetting', () => {
    it('should return a setting with given id', async () => {
      const setting = { ...generate(SettingCreateDto, true), id: 1 };
      mockSettingsRepository.save(setting);
      expect(await service.getSetting(1)).toMatchObject(setting);
    });

    it('should throw error if setting not found', async () => {
      await expect(service.getSetting(12345)).rejects.toThrow(NotFoundError);
    });
  });

  describe('createSetting', () => {
    it('should create setting', async () => {
      const createData = generate(SettingCreateDto, true);
      createData.type = SettingType.String;
      const created = await service.createSetting(createData);
      expect(created).toMatchObject({ ...createData, id: expect.any(Number) });
    });
  });

  describe('updateSetting', () => {
    it('should update setting', async () => {
      const createData = generate(SettingCreateDto, true);
      createData.type = SettingType.String;
      const { id } = await service.createSetting(createData);
      const updateData = generate(SettingUpdateDto, true);
      const updated = await service.updateSetting(id, updateData);
      expect(updated).toMatchObject({ ...createData, ...updateData, id });
    });

    it('should throw error if setting not found', async () => {
      await expect(service.updateSetting(12345, { value: '' })).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe('deleteSetting', () => {
    it('should delete setting', async () => {
      const createData = generate(SettingCreateDto, true);
      createData.builtin = false;
      createData.type = SettingType.String;
      const { id } = await service.createSetting(createData);
      await service.deleteSetting(id);
      expect(
        mockSettingsRepository.entities.find((s) => s.id === id),
      ).toBeUndefined();
    });

    it('should throw error if setting not found', async () => {
      await expect(service.deleteSetting(12345)).rejects.toThrow(NotFoundError);
    });
  });
});
