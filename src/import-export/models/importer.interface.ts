import { Collection } from './collection.type';
import { IdMap } from './id-map.type';

export interface Importer {
  import(data: Collection): Promise<IdMap>;
}
