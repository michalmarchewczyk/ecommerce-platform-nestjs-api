import { Injectable } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { Exporter } from '../import-export/models/exporter.interface';
import { Setting } from './models/setting.entity';

@Injectable()
export class SettingsExporter implements Exporter<Setting> {
  constructor(private settingsService: SettingsService) {}

  async export(): Promise<Setting[]> {
    const settings = await this.settingsService.getSettings();
    const preparedSettings: Setting[] = [];
    for (const setting of settings) {
      preparedSettings.push(this.prepareSetting(setting));
    }
    return preparedSettings;
  }

  private prepareSetting(setting: Setting) {
    const preparedSetting = new Setting();
    preparedSetting.builtin = setting.builtin;
    preparedSetting.name = setting.name;
    preparedSetting.description = setting.description;
    preparedSetting.defaultValue = setting.defaultValue;
    preparedSetting.value = setting.value;
    preparedSetting.type = setting.type;
    return preparedSetting;
  }
}
