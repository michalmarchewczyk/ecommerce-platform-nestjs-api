import { Test, TestingModule } from '@nestjs/testing';
import { ImportService } from './import.service';
import { SettingsImporter } from '../settings/settings.importer';

describe('ImportService', () => {
  let service: ImportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportService,
        {
          provide: SettingsImporter,
          useValue: {
            import: jest.fn(() => true),
          },
        },
      ],
    }).compile();

    service = module.get<ImportService>(ImportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('import', () => {
    it('should call import on all importers', async () => {
      const settingsImporter = service['settingsImporter'];
      const result = await service.import(
        Buffer.from('{"settings": ["test"]}', 'utf-8'),
        'application/json',
      );
      expect(settingsImporter.import).toHaveBeenCalledWith(['test']);
      expect(result).toEqual({
        imports: {
          settings: true,
        },
        errors: [],
      });
    });

    it('should ignore unknown data types', async () => {
      const settingsImporter = service['settingsImporter'];
      const result = await service.import(
        Buffer.from('{"unknown": ["test"]}', 'utf-8'),
        'application/json',
      );
      expect(settingsImporter.import).not.toHaveBeenCalled();
      expect(result).toEqual({
        imports: {},
        errors: [],
      });
    });

    it('should return errors', async () => {
      const settingsImporter = service['settingsImporter'];
      settingsImporter.import = jest.fn(() => {
        throw new Error('test error');
      });
      const result = await service.import(
        Buffer.from('{"settings": ["test"]}', 'utf-8'),
        'application/json',
      );
      expect(settingsImporter.import).toHaveBeenCalledWith(['test']);
      expect(result).toEqual({
        imports: {
          settings: false,
        },
        errors: ['test error'],
      });
    });
  });
});
