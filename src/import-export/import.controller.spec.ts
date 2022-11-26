import { Test, TestingModule } from '@nestjs/testing';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { SettingsImporter } from '../settings/settings.importer';
import { generateFileMetadata } from '../../test/utils/generate-file-metadata';

describe('ImportController', () => {
  let controller: ImportController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImportController],
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

    controller = module.get<ImportController>(ImportController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('import', () => {
    it('should call import on all importers', async () => {
      const settingsImporter = controller['importService']['settingsImporter'];
      const result = await controller.import(
        generateFileMetadata('{"settings": ["test"]}'),
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
      const settingsImporter = controller['importService']['settingsImporter'];
      const result = await controller.import(
        generateFileMetadata('{"unknown": ["test"]}'),
      );
      expect(settingsImporter.import).not.toHaveBeenCalled();
      expect(result).toEqual({
        imports: {},
        errors: [],
      });
    });

    it('should return errors', async () => {
      const settingsImporter = controller['importService']['settingsImporter'];
      settingsImporter.import = jest.fn(() => {
        throw new Error('test error');
      });
      const result = await controller.import(
        generateFileMetadata('{"settings": ["test"]}'),
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
