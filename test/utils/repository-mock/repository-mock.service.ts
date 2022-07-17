import { Injectable } from '@nestjs/common';
import { getMetadataArgsStorage, QueryFailedError } from 'typeorm';

interface ColumnMetadata {
  name: string;
  mode: string;
  generated: string;
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
export class RepositoryMockService<T> {
  public entities: T[] = [];
  private typeormMetadata = getMetadataArgsStorage();
  private readonly columns: ColumnMetadata[] = [];
  private currentId = 1;
  private readonly primaryName: string;

  constructor(private entity: { new (): T }) {
    const columnsMetadata = this.typeormMetadata.filterColumns(this.entity);
    const relationsMetadata = this.typeormMetadata.filterRelations(this.entity);
    this.columns = [];
    for (const column of [...columnsMetadata, ...relationsMetadata]) {
      const options = column.options;
      let def;
      if ('mode' in column) {
        def = column.options.default ? () => column.options.default : null;
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
    this.primaryName = this.columns.find((c) => c.primary).name;
  }

  public save(entity: Partial<T>): T;
  public save(entities: Partial<T>[]): T[];

  public save(entity: Partial<T> | Partial<T>[]): T | T[] {
    if (Array.isArray(entity)) {
      return entity.map((entity) => this.save(entity));
    }
    const found = this.entities.find(
      (e) => e[this.primaryName] === entity[this.primaryName] || e === entity,
    );
    if (found) {
      return this.saveExistingEntity(found, entity);
    } else {
      return this.saveNewEntity(entity);
    }
  }

  private checkUnique(name, value, savedValue?) {
    return (
      this.entities.map((e) => e[name]).includes(value) &&
      (savedValue ? value !== savedValue : true)
    );
  }

  private saveExistingEntity(savedEntity: T, entity: Partial<T>) {
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

  private saveNewEntity(entity: Partial<T>) {
    const newEntity = {};
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

  find(): T[] {
    return this.entities;
  }

  private findWhere(where: Record<string, any>): T[] {
    return this.entities.filter((e) => {
      for (const key in where) {
        if (e[key] !== where[key]) {
          return false;
        }
      }
      return true;
    });
  }

  findOne(options: {
    select?: Record<string, boolean>;
    relations?: Record<string, boolean>;
    where?: Record<string, any>;
  }): T | null {
    const foundEntity = this.findWhere(options.where)[0];
    if (!foundEntity) {
      return null;
    }
    const selectedColumns = this.getSelectedColumns(options.select);
    const selectedEntity = {};
    for (const column of selectedColumns) {
      selectedEntity[column] = foundEntity[column];
    }
    return selectedEntity as T;
  }

  private getSelectedColumns(select: Record<string, boolean>) {
    return this.columns
      .filter((column) => {
        return select ? select[column.name] === true : !column.hidden;
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
