import { Injectable } from '@nestjs/common';
import { DataType } from './models/data-type.enum';
import { SettingsExporter } from '../settings/settings.exporter';
import { Exporter } from './models/exporter.interface';
import { UsersExporter } from '../users/users.exporter';
import { AttributeTypesExporter } from '../catalog/attribute-types/attribute-types.exporter';
import { GenericError } from '../errors/generic.error';
import { ProductsExporter } from '../catalog/products/products.exporter';
import { JsonSerializer } from './json-serializer.service';
import { ZipSerializer } from './zip-serializer.service';
import { checkDataTypeDependencies } from './data-type.utils';

@Injectable()
export class ExportService {
  constructor(
    private jsonSerializer: JsonSerializer,
    private zipSerializer: ZipSerializer,
    private settingExporter: SettingsExporter,
    private usersExporter: UsersExporter,
    private attributeTypesExporter: AttributeTypesExporter,
    private productsExporter: ProductsExporter,
  ) {}

  async export(data: DataType[], format: 'json' | 'csv') {
    checkDataTypeDependencies(data);
    const toExport: Record<string, any[]> = {};
    for (const key of data) {
      toExport[key] = await this.exportCollection(key);
    }
    if (format === 'json') {
      return await this.jsonSerializer.serialize(toExport);
    } else if (format === 'csv') {
      return await this.zipSerializer.serialize(toExport);
    } else {
      throw new GenericError('could not serialize export output');
    }
  }

  private async exportCollection(type: DataType) {
    const exporters: Record<string, Exporter<any>> = {
      [DataType.Settings]: this.settingExporter,
      [DataType.Users]: this.usersExporter,
      [DataType.AttributeTypes]: this.attributeTypesExporter,
      [DataType.Products]: this.productsExporter,
    };
    return await exporters[type].export();
  }
}
