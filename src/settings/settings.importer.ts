import { Injectable } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { Collection } from '../import-export/models/collection.type';
import { Setting } from './models/setting.entity';
import { SettingType } from './models/setting-type.enum';
import { ParseError } from '../errors/parse.error';
import { Importer } from '../import-export/models/importer.interface';

@Injectable()
export class SettingsImporter implements Importer {
  constructor(private settingsService: SettingsService) {}

  async import(settings: Collection): Promise<boolean> {
    const parsedSettings = this.parseSettings(settings);
    for (const setting of parsedSettings) {
      // TODO: handle conflicts
      // TODO: handle builtin settings
      await this.settingsService.createSetting(setting);
    }
    return true;
  }

  private parseSettings(settings: Collection) {
    const parsedSettings: Setting[] = [];
    for (const setting of settings) {
      parsedSettings.push(this.parseSetting(setting));
    }
    return parsedSettings;
  }

  private parseSetting(setting: Collection[number]) {
    const parsedSetting = new Setting();
    try {
      parsedSetting.builtin = setting.builtin as boolean;
      parsedSetting.name = setting.name as string;
      parsedSetting.description = setting.description as string;
      parsedSetting.defaultValue = setting.defaultValue as string;
      parsedSetting.value = setting.value as string;
      parsedSetting.type = setting.type as SettingType;
    } catch (e) {
      throw new ParseError('setting');
    }
    return parsedSetting;
  }
}
