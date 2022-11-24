import { SetMetadata } from '@nestjs/common';

export const FEATURES_KEY = 'features';
export const Features = (...features: string[]) =>
  SetMetadata(FEATURES_KEY, features);
