import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { Setting } from './models/setting.entity';
import { SettingCreateDto } from './dto/setting-create.dto';
import { SettingUpdateDto } from './dto/setting-update.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/models/role.enum';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  @ApiOkResponse({ type: [Setting], description: 'List of all settings' })
  async getSettings(): Promise<Setting[]> {
    return this.settingsService.getSettings();
  }

  @Get('/:id(\\d+)')
  @ApiOkResponse({ type: Setting, description: 'Setting with given id' })
  @ApiNotFoundResponse({ description: 'Setting not found' })
  async getSetting(@Param('id', ParseIntPipe) id: number): Promise<Setting> {
    return this.settingsService.getSetting(id);
  }

  @Get('/:name/value')
  @ApiOkResponse({
    type: String,
    description: 'Value of the setting with given name',
  })
  @ApiNotFoundResponse({ description: 'Setting not found' })
  async getSettingValueByName(@Param('name') name: string): Promise<string> {
    return this.settingsService.getSettingValueByName(name);
  }

  @Post()
  @Roles(Role.Admin)
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiBadRequestResponse({ description: 'Invalid setting data' })
  @ApiCreatedResponse({ type: Setting, description: 'Setting created' })
  @ApiConflictResponse({
    description: 'Setting with given name already exists',
  })
  async createSetting(@Body() data: SettingCreateDto): Promise<Setting> {
    return this.settingsService.createSetting(data);
  }

  @Patch('/:id')
  @Roles(Role.Admin)
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiBadRequestResponse({ description: 'Invalid setting data' })
  @ApiNotFoundResponse({ description: 'Setting not found' })
  @ApiOkResponse({ type: Setting, description: 'Setting updated' })
  async updateSetting(
    @Param('id') id: number,
    @Body() data: SettingUpdateDto,
  ): Promise<Setting> {
    return this.settingsService.updateSetting(id, data);
  }

  @Delete('/:id')
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiNotFoundResponse({ description: 'Setting not found' })
  @ApiOkResponse({ description: 'Setting deleted' })
  @Roles(Role.Admin)
  async deleteSetting(@Param('id') id: number): Promise<void> {
    await this.settingsService.deleteSetting(id);
  }
}
