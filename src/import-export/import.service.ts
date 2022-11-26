import { Injectable } from '@nestjs/common';
import { DataType } from './models/data-type.enum';
import { SettingsImporter } from '../settings/settings.importer';
import { Collection } from './models/collection.type';
import { Importer } from './models/importer.interface';

@Injectable()
export class ImportService {
  constructor(private settingsImporter: SettingsImporter) {}

  async import(json: string): Promise<{
    imports: Record<string, boolean>;
    errors: string[];
  }> {
    const data = JSON.parse(json);
    const imports: Record<string, boolean> = {};
    const errors: string[] = [];
    for (const key of Object.keys(data)) {
      if (this.checkDataType(key)) {
        const [success, error] = await this.importCollection(key, data[key]);
        imports[key] = success;
        errors.push(...error);
      }
    }
    return { imports, errors };
  }

  private checkDataType(type: string): type is DataType {
    return (
      type in DataType ||
      (Object.keys(DataType) as Array<keyof typeof DataType>).some(
        (k) => DataType[k] === type,
      )
    );
  }

  private async importCollection(
    type: DataType,
    data: Collection,
  ): Promise<[boolean, string[]]> {
    const importers: Record<string, Importer> = {
      [DataType.Settings]: this.settingsImporter,
    };
    let success;
    const errors: string[] = [];
    try {
      success = await importers[type].import(data);
    } catch (e: any) {
      success = false;
      errors.push(e.message);
    }
    return [success, errors];
  }
}
