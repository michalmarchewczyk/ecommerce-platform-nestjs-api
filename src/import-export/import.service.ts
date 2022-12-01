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
import { UsersImporter } from '../users/users.importer';
import { AttributeTypesImporter } from '../catalog/attribute-types/attribute-types.importer';
import { IdMap } from './models/id-map.type';
import { dataTypeDependencies } from './models/data-type-dependencies.data';
import { GenericError } from '../errors/generic.error';

@Injectable()
export class ImportService {
  private idMaps: Record<string, IdMap> = {};

  constructor(
    private settingsImporter: SettingsImporter,
    private usersImporter: UsersImporter,
    private attributeTypesImporter: AttributeTypesImporter,
  ) {}

  async import(data: Buffer, filetype: string) {
    let collections: Record<string, Collection> = {};
    if (filetype === 'application/json') {
      collections = await this.parseJson(data.toString());
    } else if (filetype === 'application/gzip') {
      collections = await this.parseZip(data);
    }
    const imports: Record<string, boolean> = {};
    const errors: string[] = [];
    this.checkDataTypeDependencies(Object.keys(collections));
    for (const key of Object.keys(collections)) {
      if (this.checkDataType(key)) {
        const [idMap, error] = await this.importCollection(
          key,
          collections[key],
        );
        this.idMaps[key] = idMap ?? {};
        imports[key] = !!idMap;
        errors.push(...error);
      }
    }
    return { imports, errors };
  }

  private checkDataTypeDependencies(data: string[]) {
    for (const type of data) {
      const dependencies = dataTypeDependencies.find((d) => d[0] === type)?.[1];
      if (!dependencies) {
        throw new GenericError(`"${type}" is not recognized data type`);
      }
      for (const dependency of dependencies) {
        if (!data.includes(dependency)) {
          throw new GenericError(`"${type}" depends on "${dependency}"`);
        }
      }
    }
  }

  private async parseJson(data: string): Promise<Record<string, Collection>> {
    return JSON.parse(data);
  }

  private async parseZip(data: Buffer): Promise<Record<string, Collection>> {
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
      collections[filename.split('.')[0]] = await this.parseCsv(csv);
    }
    return collections;
  }

  private async parseCsv(csv: string) {
    const parser: Record<string, any> = {};
    const headers = (
      await csvtojson({
        output: 'csv',
        noheader: true,
      }).fromString(csv.split(os.EOL)[0])
    )[0];
    for (const header of headers) {
      parser[header] = 'string';
    }
    return csvtojson({
      checkType: true,
      colParser: parser,
    })
      .preFileLine((fileLineString, lineIdx) => {
        if (lineIdx === 1) {
          const columns = fileLineString.split(',');
          columns.forEach((column, index) => {
            if (!column.startsWith('"') || !column.endsWith('"')) {
              delete parser[headers[index]];
            }
          });
        }
        return fileLineString;
      })
      .fromString(csv);
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
  ): Promise<[IdMap | null, string[]]> {
    const importers: Record<string, Importer> = {
      [DataType.Settings]: this.settingsImporter,
      [DataType.Users]: this.usersImporter,
      [DataType.AttributeTypes]: this.attributeTypesImporter,
    };
    let idMap: IdMap | null = null;
    const errors: string[] = [];
    try {
      idMap = await importers[type].import(data);
    } catch (e: any) {
      errors.push(e.message);
    }
    return [idMap, errors];
  }
}
