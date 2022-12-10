import { Test, TestingModule } from '@nestjs/testing';
import { ImportService } from './import.service';
import { SettingsImporter } from '../settings/settings.importer';
import { UsersImporter } from '../users/users.importer';
import { AttributeTypesImporter } from '../catalog/attribute-types/attribute-types.importer';
import { GenericError } from '../errors/generic.error';
import { ProductsImporter } from '../catalog/products/products.importer';
import { JsonSerializer } from './json-serializer.service';
import { ZipSerializer } from './zip-serializer.service';
import { CategoriesImporter } from '../catalog/categories/categories.importer';
import { WishlistsImporter } from '../wishlists/wishlists.importer';
import { DeliveryMethodsImporter } from '../sales/delivery-methods/delivery-methods.importer';
import { PaymentMethodsImporter } from '../sales/payment-methods/payment-methods.importer';
import { OrdersImporter } from '../sales/orders/orders.importer';
import { ReturnsImporter } from '../sales/returns/returns.importer';
import { ProductPhotosImporter } from '../catalog/products/product-photos/product-photos.importer';
import { PagesImporter } from '../pages/pages.importer';

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
            import: jest.fn(() => ({ '1': 1 })),
            clear: jest.fn(() => 0),
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
        {
          provide: CategoriesImporter,
          useValue: {},
        },
        {
          provide: WishlistsImporter,
          useValue: {},
        },
        {
          provide: DeliveryMethodsImporter,
          useValue: {},
        },
        {
          provide: PaymentMethodsImporter,
          useValue: {},
        },
        {
          provide: OrdersImporter,
          useValue: {},
        },
        {
          provide: ReturnsImporter,
          useValue: {},
        },
        {
          provide: ProductPhotosImporter,
          useValue: {},
        },
        {
          provide: PagesImporter,
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
        true,
        false,
      );
      expect(settingsImporter.import).toHaveBeenCalledWith(
        ['test'],
        expect.any(Object),
      );
      expect(settingsImporter.clear).toHaveBeenCalled();
      expect(result).toEqual({
        deleted: {
          settings: 0,
        },
        added: {
          settings: 1,
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
          false,
          false,
        ),
      ).rejects.toThrow(
        new GenericError('"unknown" is not recognized data type'),
      );
      expect(settingsImporter.import).not.toHaveBeenCalled();
      expect(settingsImporter.clear).not.toHaveBeenCalled();
    });

    it('should return errors', async () => {
      const settingsImporter = service['settingsImporter'];
      settingsImporter.import = jest.fn(() => {
        throw new Error('test error');
      });
      const result = await service.import(
        Buffer.from('{"settings": ["test"]}', 'utf-8'),
        'application/json',
        false,
        false,
      );
      expect(settingsImporter.import).toHaveBeenCalledWith(
        ['test'],
        expect.any(Object),
      );
      expect(settingsImporter.clear).not.toHaveBeenCalled();
      expect(result).toEqual({
        added: {
          settings: 0,
        },
        deleted: {},
        errors: ['test error'],
      });
    });
  });
});
