import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FEATURE_KEY } from './feature.decorator';
import { SettingsService } from '../settings.service';

@Injectable()
export class FeatureEnabledGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private settingService: SettingsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const feature = this.reflector.getAllAndOverride<string>(FEATURE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!feature) {
      return true;
    }
    const enabled = await this.settingService.getSettingValueByName(feature);
    if (enabled !== 'true') {
      throw new NotFoundException();
    }
    return true;
  }
}
