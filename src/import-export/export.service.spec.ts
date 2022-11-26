import { Test, TestingModule } from '@nestjs/testing';
import { ExportService } from './export.service';
import { SettingsExporter } from '../settings/settings.exporter';
import { DataType } from './models/data-type.enum';

describe('ExportService', () => {
  let service: ExportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportService,
        {
          provide: SettingsExporter,
          useValue: {
            export: jest.fn(async () => ['test']),
          },
        },
      ],
    }).compile();

    service = module.get<ExportService>(ExportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('export', () => {
    it('should return an object with the exported data', async () => {
      const result = await service.export([DataType.Settings]);
      expect(result).toEqual({ settings: ['test'] });
    });
  });
});
