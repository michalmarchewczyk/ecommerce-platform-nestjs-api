import { SettingCreateDto } from '../settings/dto/setting-create.dto';
import { SettingType } from '../settings/entities/setting-type.enum';

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
    description: 'Available countries',
    type: SettingType.CountriesList,
    defaultValue: 'US,CA,GB,FR,DE,IT,ES,JP,PL',
  },
];
