import { Test, TestingModule } from '@nestjs/testing';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { SettingsImporter } from '../settings/settings.importer';
import { generateFileMetadata } from '../../test/utils/generate-file-metadata';
import { UsersImporter } from '../users/users.importer';
import { AttributeTypesImporter } from '../catalog/attribute-types/attribute-types.importer';
import { GenericError } from '../errors/generic.error';
import { ProductsImporter } from '../catalog/products/products.importer';

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
        {
          provide: UsersImporter,
          useValue: {},
        },
        {
          provide: AttributeTypesImporter,
          useValue: {},
        },
        {
          provide: ProductsImporter,
          useValue: {},
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
        generateFileMetadata('{"settings": ["test"]}', 'application/json'),
      );
      expect(settingsImporter.import).toHaveBeenCalledWith(
        ['test'],
        expect.any(Object),
      );
      expect(result).toEqual({
        imports: {
          settings: true,
        },
        errors: [],
      });
    });

    it('should throw error on unrecognized data types', async () => {
      const settingsImporter = controller['importService']['settingsImporter'];
      await expect(
        controller.import(
          generateFileMetadata('{"unknown": ["test"]}', 'application/json'),
        ),
      ).rejects.toThrow(
        new GenericError('"unknown" is not recognized data type'),
      );
      expect(settingsImporter.import).not.toHaveBeenCalled();
    });

    it('should return errors', async () => {
      const settingsImporter = controller['importService']['settingsImporter'];
      settingsImporter.import = jest.fn(() => {
        throw new Error('test error');
      });
      const result = await controller.import(
        generateFileMetadata('{"settings": ["test"]}', 'application/json'),
      );
      expect(settingsImporter.import).toHaveBeenCalledWith(
        ['test'],
        expect.any(Object),
      );
      expect(result).toEqual({
        imports: {
          settings: false,
        },
        errors: ['test error'],
      });
    });
  });
});
