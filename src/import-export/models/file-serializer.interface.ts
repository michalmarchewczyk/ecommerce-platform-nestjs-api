import { Collection } from './collection.type';
import { StreamableFile } from '@nestjs/common';

export interface FileSerializer {
  parse(data: Buffer): Promise<Record<string, Collection>>;
  serialize(data: Record<string, any>): Promise<StreamableFile>;
}
