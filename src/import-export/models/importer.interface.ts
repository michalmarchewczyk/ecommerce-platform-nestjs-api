import { Collection } from './collection.type';
import { IdMap } from './id-map.type';

export interface Importer {
  import(data: Collection, idMaps?: Record<string, IdMap>): Promise<IdMap>;
  clear(): Promise<number>;
}
