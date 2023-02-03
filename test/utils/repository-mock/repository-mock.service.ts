import { Injectable, ValueProvider } from '@nestjs/common';
import { DeepPartial, getMetadataArgsStorage, QueryFailedError } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

interface ColumnMetadata {
  name: string;
  mode: string;
  generated: string | null;
  unique: boolean;
  primary: boolean;
  optional: boolean;
  default: null | (() => any);
  hidden: boolean;
}

const RELATION_TYPES = [
  'many-to-many',
  'one-to-one',
  'many-to-one',
  'one-to-many',
];

@Injectable()
export class RepositoryMockService<T extends { [key: string]: any }> {
  public entities: T[] = [];
  private typeormMetadata = getMetadataArgsStorage();
  private readonly columns: ColumnMetadata[] = [];
  private currentId = 1;
  private readonly primaryName: string;

  static getProvider<U extends { [key: string]: any }>(entity: {
    new (): U;
  }): ValueProvider<RepositoryMockService<U>> {
    return {
      provide: getRepositoryToken(entity),
      useValue: new RepositoryMockService<U>(entity),
    };
  }

  constructor(private entity: { new (): T }) {
    const columnsMetadata = this.typeormMetadata.filterColumns(this.entity);
    const relationsMetadata = this.typeormMetadata.filterRelations(this.entity);
    this.columns = [];
    for (const column of [...columnsMetadata, ...relationsMetadata]) {
      const options = column.options;
      let def;
      if ('mode' in column) {
        def =
          typeof column.options.default !== 'undefined'
            ? () => column.options.default
            : null;
      } else {
        def = column.relationType.endsWith('many') ? () => [] : null;
      }
      this.columns.push({
        name: column.propertyName,
        mode: 'mode' in column ? column.mode : column.relationType,
        generated:
          this.typeormMetadata.findGenerated(this.entity, column.propertyName)
            ?.strategy ?? null,
        unique:
          'unique' in options ? !!(options.unique || options.primary) : false,
        primary: 'primary' in options ? !!options.primary : false,
        optional: (options.nullable || 'relationType' in column) ?? false,
        default: def,
        hidden: 'select' in options ? options.select === false ?? false : false,
      });
    }
    this.primaryName = this.columns.find((c) => c.primary)?.name ?? '';
  }

  public save(entity: DeepPartial<T>): T;
  public save(entities: DeepPartial<T>[]): T[];

  public save(entity: DeepPartial<T> | DeepPartial<T>[]): T | T[] {
    if (Array.isArray(entity)) {
      return entity.map((entity) => this.save(entity));
    }
    const found = this.entities.find(
      (e: { [key: string]: any }) =>
        e[this.primaryName] === entity[this.primaryName] || e === entity,
    );
    if (found) {
      return this.saveExistingEntity(found, entity);
    } else {
      return this.saveNewEntity(entity);
    }
  }

  private checkUnique(name: string, value: any, savedValue?: any) {
    return (
      this.entities.map((e) => e[name]).includes(value) &&
      (savedValue ? value !== savedValue : true)
    );
  }

  private saveExistingEntity(
    savedEntity: { [key: string]: any },
    entity: DeepPartial<T>,
  ) {
    for (const { name, mode, unique } of this.columns) {
      if (unique && this.checkUnique(name, entity[name], savedEntity[name])) {
        throw new QueryFailedError('', [], '');
      } else if (mode === 'updateDate') {
        savedEntity[name] = new Date();
      } else if ([...RELATION_TYPES, 'regular'].includes(mode)) {
        savedEntity[name] = entity[name] ?? savedEntity[name];
      }
    }
    return savedEntity as T;
  }

  private saveNewEntity(entity: DeepPartial<T>) {
    const newEntity: { [key: string]: any } = {};
    for (const column of this.columns) {
      const { name, mode, optional, default: def } = column;
      if (column.unique && this.checkUnique(name, entity[name])) {
        throw new QueryFailedError('', [], '');
      } else if (column.generated) {
        newEntity[name] = this.generateId();
      } else if (mode === 'createDate' || mode === 'updateDate') {
        newEntity[name] = new Date();
      } else if (entity[name] === undefined && !optional && !def) {
        throw new QueryFailedError('', [], '');
      } else if ([...RELATION_TYPES, 'regular'].includes(mode)) {
        newEntity[name] = entity[name] ?? def?.() ?? null;
      }
    }
    this.entities.push(newEntity as T);
    return newEntity as T;
  }

  private generateId() {
    return this.currentId++;
  }

  find(options?: {
    select?: Record<string, boolean>;
    relations?: Record<string, boolean>;
    where?: Record<string, any>;
  }): T[] {
    const foundEntities = this.findWhere(options?.where ?? {});
    if (!foundEntities) {
      return [];
    }
    const selectedColumns = this.getSelectedColumns(options?.select);
    const results = [];
    for (const foundEntity of foundEntities) {
      const selectedEntity: { [key: string]: any } = {};
      for (const column of selectedColumns) {
        selectedEntity[column] = foundEntity[column];
      }
      results.push(selectedEntity as T);
    }
    return results;
  }

  private findWhere(where?: Record<string, any>): T[] {
    return this.entities.filter((e) => {
      return this.matchObject(e, where);
    });
  }

  private matchObject(obj: Record<string, any>, match?: Record<string, any>) {
    for (const key in match) {
      if (typeof obj?.[key] === 'object' && typeof match?.[key] === 'object') {
        if (!this.matchObject(obj?.[key], match?.[key])) {
          return false;
        }
      } else if (obj?.[key] !== match?.[key] && match?.[key] !== undefined) {
        return false;
      }
    }
    return true;
  }

  findOne(options: {
    select?: Record<string, boolean>;
    relations?: Record<string, boolean>;
    where?: Record<string, any>;
  }): T | null {
    return this.find(options)[0] ?? null;
  }

  private getSelectedColumns(select?: Record<string, boolean>) {
    return this.columns
      .filter((column) => {
        return select ? select[column.name] : !column.hidden;
      })
      .map((column) => column.name);
  }

  delete(where: Record<string, any>): void {
    const foundEntity = this.findWhere(where)[0];
    if (foundEntity) {
      this.entities = this.entities.filter((entity) => entity !== foundEntity);
    }
  }
}
