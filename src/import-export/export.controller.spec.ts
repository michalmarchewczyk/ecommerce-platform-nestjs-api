import { Test, TestingModule } from '@nestjs/testing';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { SettingsExporter } from '../settings/settings.exporter';
import { DataType } from './models/data-type.enum';
import { UsersExporter } from '../users/users.exporter';
import { AttributeTypesExporter } from '../catalog/attribute-types/attribute-types.exporter';
import { ProductsExporter } from '../catalog/products/products.exporter';
import { JsonSerializer } from './json-serializer.service';
import { ZipSerializer } from './zip-serializer.service';
import { CategoriesExporter } from '../catalog/categories/categories.exporter';
import { WishlistsExporter } from '../wishlists/wishlists.exporter';
import { DeliveryMethodsExporter } from '../sales/delivery-methods/delivery-methods.exporter';
import { PaymentMethodsExporter } from '../sales/payment-methods/payment-methods.exporter';
import { OrdersExporter } from '../sales/orders/orders.exporter';
import { ReturnsExporter } from '../sales/returns/returns.exporter';
import { ProductPhotosExporter } from '../catalog/products/product-photos/product-photos.exporter';
import { PagesExporter } from '../pages/pages.exporter';

describe('ExportController', () => {
  let controller: ExportController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExportController],
      providers: [
        ExportService,
        JsonSerializer,
        ZipSerializer,
        {
          provide: SettingsExporter,
          useValue: {
            export: jest.fn(async () => ['test']),
          },
        },
        {
          provide: UsersExporter,
          useValue: {},
        },
        {
          provide: AttributeTypesExporter,
          useValue: {},
        },
        {
          provide: ProductsExporter,
          useValue: {},
        },
        {
          provide: CategoriesExporter,
          useValue: {},
        },
        {
          provide: WishlistsExporter,
          useValue: {},
        },
        {
          provide: DeliveryMethodsExporter,
          useValue: {},
        },
        {
          provide: PaymentMethodsExporter,
          useValue: {},
        },
        {
          provide: OrdersExporter,
          useValue: {},
        },
        {
          provide: ReturnsExporter,
          useValue: {},
        },
        {
          provide: ProductPhotosExporter,
          useValue: {},
        },
        {
          provide: PagesExporter,
          useValue: {},
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
        format: 'json',
      });
      let str = '';
      result.getStream().on('data', (chunk) => {
        str += chunk;
      });
      result.getStream().on('end', () => {
        expect(str).toEqual('{"settings":["test"]}');
      });
      expect(res.header).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('export_'),
      );
    });
  });
});
