import { Test, TestingModule } from '@nestjs/testing';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { SettingsExporter } from '../settings/settings.exporter';
import { DataType } from './models/data-type.enum';

describe('ExportController', () => {
  let controller: ExportController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExportController],
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

    controller = module.get<ExportController>(ExportController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('export', () => {
    it('should return an object with the exported data', async () => {
      jest.useFakeTimers().setSystemTime(new Date());
      const res = {
        header: jest.fn(),
      };
      const result = await controller.export(res as any, {
        data: [DataType.Settings],
      });
      expect(result).toEqual({ settings: ['test'] });
      expect(res.header).toHaveBeenCalledWith(
        'Content-Disposition',
        `attachment; filename="export-${new Date().toISOString()}.json"`,
      );
    });
  });
});
