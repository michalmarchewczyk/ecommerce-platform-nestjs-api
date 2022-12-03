import { Test, TestingModule } from '@nestjs/testing';
import { ExportService } from './export.service';
import { SettingsExporter } from '../settings/settings.exporter';
import { DataType } from './models/data-type.enum';
import { UsersExporter } from '../users/users.exporter';
import { AttributeTypesExporter } from '../catalog/attribute-types/attribute-types.exporter';
import { ProductsExporter } from '../catalog/products/products.exporter';
import { JsonSerializer } from './json-serializer.service';
import { ZipSerializer } from './zip-serializer.service';

describe('ExportService', () => {
  let service: ExportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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

    service = module.get<ExportService>(ExportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('export', () => {
    it('should return an object with the exported data', async () => {
      const result = await service.export([DataType.Settings], 'json');
      let str = '';
      result.getStream().on('data', (chunk) => {
        str += chunk;
      });
      result.getStream().on('end', () => {
        expect(str).toEqual('{"settings":["test"]}');
      });
    });
  });
});
