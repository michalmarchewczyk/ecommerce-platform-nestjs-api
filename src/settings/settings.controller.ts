import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { Setting } from './entities/setting.entity';
import { SettingCreateDto } from './dto/setting-create.dto';
import { SettingUpdateDto } from './dto/setting-update.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/entities/role.enum';

@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  async getSettings(): Promise<Setting[]> {
    return this.settingsService.getSettings();
  }

  @Get('/:id')
  async getSetting(@Param('id') id: number): Promise<Setting> {
    return this.settingsService.getSetting(id);
  }

  @Post()
  @Roles(Role.Admin)
  async createSetting(@Body() data: SettingCreateDto): Promise<Setting> {
    return this.settingsService.createSetting(data);
  }

  @Patch('/:id')
  @Roles(Role.Admin)
  async updateSetting(
    @Param('id') id: number,
    @Body() data: SettingUpdateDto,
  ): Promise<Setting> {
    return this.settingsService.updateSetting(id, data);
  }

  @Delete('/:id')
  @Roles(Role.Admin)
  async deleteSetting(@Param('id') id: number): Promise<void> {
    await this.settingsService.deleteSetting(id);
  }
}
