import { Injectable } from '@nestjs/common';
import { DataType } from './models/data-type.enum';
import { SettingsImporter } from '../settings/settings.importer';
import { Collection } from './models/collection.type';
import { Importer } from './models/importer.interface';
import { UsersImporter } from '../users/users.importer';
import { AttributeTypesImporter } from '../catalog/attribute-types/attribute-types.importer';
import { IdMap } from './models/id-map.type';
import { dataTypeDependencies } from './models/data-type-dependencies.data';
import { ProductsImporter } from '../catalog/products/products.importer';
import { ZipSerializer } from './zip-serializer.service';
import { JsonSerializer } from './json-serializer.service';
import { checkDataType, checkDataTypeDependencies } from './data-type.utils';

@Injectable()
export class ImportService {
  private idMaps: Record<string, IdMap> = {};

  constructor(
    private jsonSerializer: JsonSerializer,
    private zipSerializer: ZipSerializer,
    private settingsImporter: SettingsImporter,
    private usersImporter: UsersImporter,
    private attributeTypesImporter: AttributeTypesImporter,
    private productsImporter: ProductsImporter,
  ) {}

  async import(data: Buffer, filetype: string) {
    this.idMaps = {};
    let collections: Record<string, Collection> = {};
    if (filetype === 'application/json') {
      collections = await this.jsonSerializer.parse(data);
    } else if (filetype === 'application/gzip') {
      collections = await this.zipSerializer.parse(data);
    }
    const imports: Record<string, boolean> = {};
    const errors: string[] = [];
    checkDataTypeDependencies(Object.keys(collections));
    const keys = dataTypeDependencies
      .map((d) => d[0])
      .filter((k) => k in collections);
    for (const key of keys) {
      if (checkDataType(key)) {
        const [idMap, error] = await this.importCollection(
          key,
          collections[key],
        );
        this.idMaps[key] = idMap ?? {};
        imports[key] = !!idMap;
        if (error) {
          errors.push(error);
        }
      }
    }
    return { imports, errors };
  }

  private async importCollection(type: DataType, data: Collection) {
    const importers: Record<string, Importer> = {
      [DataType.Settings]: this.settingsImporter,
      [DataType.Users]: this.usersImporter,
      [DataType.AttributeTypes]: this.attributeTypesImporter,
      [DataType.Products]: this.productsImporter,
    };
    let idMap: IdMap | null = null;
    try {
      idMap = await importers[type].import(data, this.idMaps);
    } catch (e: any) {
      return [null, e.message] as [null, string];
    }
    return [idMap, null] as [IdMap, null];
  }
}
