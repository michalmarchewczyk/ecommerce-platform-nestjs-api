import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FEATURES_KEY } from './features.decorator';
import { SettingsService } from '../settings.service';

@Injectable()
export class FeaturesEnabledGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private settingService: SettingsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const features = this.reflector.getAllAndOverride<string[]>(FEATURES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!features) {
      return true;
    }
    for (const feature of features) {
      const enabled = await this.settingService.getSettingValueByName(feature);
      if (enabled !== 'true') {
        throw new NotFoundException();
      }
    }
    return true;
  }
}
