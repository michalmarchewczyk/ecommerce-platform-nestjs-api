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
        `attachment; filename="export-${new Date().toISOString()}.json"`,
      );
    });
  });
});
