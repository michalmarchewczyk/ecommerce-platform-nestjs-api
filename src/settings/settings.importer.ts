import { Injectable } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { Collection } from '../import-export/models/collection.type';
import { Setting } from './models/setting.entity';
import { SettingType } from './models/setting-type.enum';
import { ParseError } from '../errors/parse.error';
import { Importer } from '../import-export/models/importer.interface';
import { IdMap } from '../import-export/models/id-map.type';

@Injectable()
export class SettingsImporter implements Importer {
  constructor(private settingsService: SettingsService) {}

  async import(settings: Collection): Promise<IdMap> {
    const parsedSettings = this.parseSettings(settings);
    for (const setting of parsedSettings) {
      if (setting.builtin) {
        try {
          const { id } = await this.settingsService.getSettingByName(
            setting.name,
          );
          await this.settingsService.updateSetting(id, {
            value: setting.value,
          });
        } catch (e) {
          await this.settingsService.createSetting(setting);
        }
      } else {
        await this.settingsService.createSetting(setting);
      }
      // TODO: handle conflicts
    }
    return {};
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
