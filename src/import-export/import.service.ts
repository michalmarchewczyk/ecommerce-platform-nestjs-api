import { Injectable } from '@nestjs/common';
import { DataType } from './models/data-type.enum';
import { SettingsImporter } from '../settings/settings.importer';
import { Collection } from './models/collection.type';
import { Importer } from './models/importer.interface';
import * as csvtojson from 'csvtojson';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import * as tar from 'tar';
import { Readable } from 'stream';

@Injectable()
export class ImportService {
  constructor(private settingsImporter: SettingsImporter) {}

  async import(
    data: Buffer,
    filetype: string,
  ): Promise<{
    imports: Record<string, boolean>;
    errors: string[];
  }> {
    let collections: Record<string, Collection> = {};
    if (filetype === 'application/json') {
      collections = await this.parseJson(data.toString());
    } else if (filetype === 'application/gzip') {
      collections = await this.parseCsv(data);
    }
    const imports: Record<string, boolean> = {};
    const errors: string[] = [];
    for (const key of Object.keys(collections)) {
      if (this.checkDataType(key)) {
        const [success, error] = await this.importCollection(
          key,
          collections[key],
        );
        imports[key] = success;
        errors.push(...error);
      }
    }
    return { imports, errors };
  }

  private async parseJson(data: string): Promise<Record<string, Collection>> {
    return JSON.parse(data);
  }

  private async parseCsv(data: Buffer): Promise<Record<string, Collection>> {
    const stream = Readable.from(data);
    const filenames: string[] = [];
    const tarStream = tar.extract({
      cwd: os.tmpdir(),
      onentry: (entry) => {
        filenames.push(entry.path);
      },
    });
    stream.pipe(tarStream);
    await new Promise((resolve) => tarStream.on('end', resolve));
    const collections: Record<string, Collection> = {};
    for (const filename of filenames) {
      const filePath = path.join(os.tmpdir(), filename);
      const csv = await fs.readFile(filePath, { encoding: 'utf-8' });
      collections[filename.split('.')[0]] = await csvtojson({
        checkType: false, // TODO: check data types for builtin and value columns
      }).fromString(csv);
    }
    return collections;
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
