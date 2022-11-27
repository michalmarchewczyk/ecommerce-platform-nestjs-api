import { Injectable, StreamableFile } from '@nestjs/common';
import { DataType } from './models/data-type.enum';
import { SettingsExporter } from '../settings/settings.exporter';
import { Exporter } from './models/exporter.interface';
import { ParseError } from '../errors/parse.error';
import * as json2csv from 'json2csv';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import * as tar from 'tar';
import { Readable } from 'stream';

@Injectable()
export class ExportService {
  constructor(private settingExporter: SettingsExporter) {}

  async export(
    data: DataType[],
    format: 'json' | 'csv',
  ): Promise<StreamableFile> {
    const toExport: Record<string, any> = {};
    for (const key of data) {
      toExport[key] = await this.exportCollection(key);
    }
    if (format === 'json') {
      return await this.serializeJSON(toExport);
    } else if (format === 'csv') {
      return await this.serializeCSV(toExport);
    } else {
      throw new ParseError('export');
    }
  }

  private async exportCollection(type: DataType) {
    const exporters: Record<string, Exporter<any>> = {
      [DataType.Settings]: this.settingExporter,
    };
    return await exporters[type].export();
  }

  private async serializeJSON(
    data: Record<string, any>,
  ): Promise<StreamableFile> {
    const parsed = JSON.stringify(data);
    return new StreamableFile(Readable.from([parsed]), {
      type: 'application/json',
    });
  }

  private async serializeCSV(
    data: Record<string, any>,
  ): Promise<StreamableFile> {
    const fields = Object.keys(data);
    const files: string[] = [];
    for (const field of fields) {
      const parsed = json2csv.parse(data[field]);
      const filePath = path.join(os.tmpdir(), `${field}.csv`);
      await fs.writeFile(filePath, parsed);
      files.push(`${field}.csv`);
    }
    const stream = tar.create({ gzip: true, cwd: os.tmpdir() }, files);
    return new StreamableFile(stream, {
      type: 'application/gzip',
    });
  }
}
