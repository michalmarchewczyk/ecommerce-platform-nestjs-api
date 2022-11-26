import { Collection } from './collection.type';

export interface Importer {
  import(data: Collection): Promise<boolean>;
}
