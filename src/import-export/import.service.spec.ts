import { Test, TestingModule } from '@nestjs/testing';
import { ImportService } from './import.service';
import { SettingsImporter } from '../settings/settings.importer';
import { UsersImporter } from '../users/users.importer';
import { AttributeTypesImporter } from '../catalog/attribute-types/attribute-types.importer';
import { GenericError } from '../errors/generic.error';
import { ProductsImporter } from '../catalog/products/products.importer';
import { JsonSerializer } from './json-serializer.service';
import { ZipSerializer } from './zip-serializer.service';

describe('ImportService', () => {
  let service: ImportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportService,
        JsonSerializer,
        ZipSerializer,
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
      const settingsImporter = service['settingsImporter'];
      await expect(
        service.import(
          Buffer.from('{"unknown": ["test"]}', 'utf-8'),
          'application/json',
        ),
      ).rejects.toThrow(
        new GenericError('"unknown" is not recognized data type'),
      );
      expect(settingsImporter.import).not.toHaveBeenCalled();
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
