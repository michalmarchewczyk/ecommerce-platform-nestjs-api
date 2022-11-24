import { SettingCreateDto } from './dto/setting-create.dto';
import { SettingType } from './models/setting-type.enum';

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
  {
    builtin: true,
    name: 'Convert images to JPEG',
    description:
      'Automatically convert uploaded images to JPEG format (recommended)',
    type: SettingType.Boolean,
    defaultValue: 'true',
  },
  {
    builtin: true,
    name: 'Thumbnail size',
    description:
      'Size of automatically generated thumbnails (in pixels, [SIZE]x[SIZE])',
    type: SettingType.Number,
    defaultValue: '400',
  },
  {
    builtin: true,
    name: 'Product ratings',
    description: 'Allow users to leave product ratings',
    type: SettingType.Boolean,
    defaultValue: 'true',
  },
  {
    builtin: true,
    name: 'Product rating photos',
    description: 'Allow users to upload photos for product ratings',
    type: SettingType.Boolean,
    defaultValue: 'true',
  },
];
