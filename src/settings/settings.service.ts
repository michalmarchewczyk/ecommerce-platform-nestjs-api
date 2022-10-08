import { Injectable, OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { SettingCreateDto } from './dto/setting-create.dto';
import { NotFoundError } from '../errors/not-found.error';
import { SettingUpdateDto } from './dto/setting-update.dto';
import { BUILTIN_SETTINGS } from '../users/builtin-settings.data';

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(
    @InjectRepository(Setting) private settingsRepository: Repository<Setting>,
  ) {}

  async onModuleInit() {
    try {
      for (const setting of BUILTIN_SETTINGS) {
        await this.createSetting(setting);
      }
    } catch (e) {
      // ignore
    }
  }

  async getSettings(): Promise<Setting[]> {
    return this.settingsRepository.find();
  }

  async getSetting(id: number): Promise<Setting> {
    const setting = await this.settingsRepository.findOne({ where: { id } });
    if (!setting) {
      throw new NotFoundError('setting', 'id', id.toString());
    }
    return setting;
  }

  async createSetting(data: SettingCreateDto): Promise<Setting> {
    const setting = new Setting();
    setting.builtin = data.builtin;
    setting.name = data.name;
    setting.description = data.description;
    setting.type = data.type;
    // TODO: type checking
    setting.defaultValue = data.defaultValue;
    setting.value = data.value ?? data.defaultValue;
    return this.settingsRepository.save(setting);
  }

  async updateSetting(id: number, data: SettingUpdateDto): Promise<Setting> {
    const setting = await this.settingsRepository.findOne({ where: { id } });
    if (!setting) {
      throw new NotFoundError('setting', 'id', id.toString());
    }
    // TODO: type checking
    setting.value = data.value;
    return this.settingsRepository.save(setting);
  }

  async deleteSetting(id: number): Promise<boolean> {
    const setting = await this.settingsRepository.findOne({ where: { id } });
    if (!setting) {
      throw new NotFoundError('setting', 'id', id.toString());
    }
    await this.settingsRepository.delete({ id });
    return true;
  }
}
