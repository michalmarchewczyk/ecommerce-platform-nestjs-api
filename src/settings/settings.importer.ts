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
    const idMap: IdMap = {};
    for (const setting of parsedSettings) {
      const found = await this.settingsService.findSettingByName(setting.name);
      if (found) {
        await this.settingsService.updateSetting(found.id, {
          value: setting.value,
        });
        idMap[setting.id] = found.id;
      } else {
        const { id: newId } = await this.settingsService.createSetting(setting);
        idMap[newId] = newId;
      }
    }
    return idMap;
  }

  async clear() {
    const settings = await this.settingsService.getSettings();
    let deleted = 0;
    for (const setting of settings) {
      await this.settingsService.deleteSetting(setting.id, true);
      deleted += 1;
    }
    return deleted;
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
