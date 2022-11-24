import { SetMetadata } from '@nestjs/common';

export const FEATURE_KEY = 'feature';
export const Feature = (feature: string) => SetMetadata(FEATURE_KEY, feature);
