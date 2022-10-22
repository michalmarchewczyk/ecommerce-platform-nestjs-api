import { SettingCreateDto } from './dto/setting-create.dto';
import { SettingType } from './entities/setting-type.enum';

export const BUILTIN_SETTINGS: SettingCreateDto[] = [
  {
    builtin: true,
    name: 'Currency',
    description: 'The currency to use for all prices',
    type: SettingType.Currency,
    defaultValue: 'USD',
  },
  {
    builtin: true,
    name: 'Countries',
    description: 'Possible countries for delivery',
    type: SettingType.CountriesList,
    defaultValue: 'US,CA',
  },
];
