import { Injectable } from '@nestjs/common';
import { DataType } from './models/data-type.enum';
import { SettingsExporter } from '../settings/settings.exporter';
import { Exporter } from './models/exporter.interface';

@Injectable()
export class ExportService {
  constructor(private settingExporter: SettingsExporter) {}

  async export(data: DataType[]) {
    const toExport: Record<string, any> = {};
    for (const key of data) {
      toExport[key] = await this.exportCollection(key);
    }
    return toExport;
  }

  private async exportCollection(type: DataType) {
    const exporters: Record<string, Exporter<any>> = {
      [DataType.Settings]: this.settingExporter,
    };
    return await exporters[type].export();
  }
}
