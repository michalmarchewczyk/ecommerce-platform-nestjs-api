import { Injectable } from '@nestjs/common';
import { getMetadataArgsStorage, QueryFailedError } from 'typeorm';

@Injectable()
export class RepositoryMockService<T> {
  public entities: T[] = [];
  private typeormMetadata = getMetadataArgsStorage();
  private columns = [];
  private currentId = 1;

  constructor(private entity: { new (): T }) {
    const columnsToGenerate = this.typeormMetadata.filterColumns(this.entity);
    const relationsToGenerate = this.typeormMetadata.filterRelations(
      this.entity,
    );
    this.columns = [];
    for (const column of columnsToGenerate) {
      this.columns.push({
        name: column.propertyName,
        mode: column.mode,
        options: column.options,
        generated:
          this.typeormMetadata.findGenerated(this.entity, column.propertyName)
            ?.strategy ?? null,
        unique: !!(column.options.unique || column.options.primary),
        primary: !!column.options.primary,
        optional: column.options.nullable ?? false,
        default: column.options.default ?? null,
        hidden: column.options.select === false ?? false,
      });
    }
    for (const relation of relationsToGenerate) {
      this.columns.push({
        name: relation.propertyName,
        mode: relation.relationType,
        options: relation.options,
        generated: null,
        unique: false,
        primary: false,
        optional: relation.options.nullable ?? false,
        default:
          relation.relationType === 'one-to-many' ||
          relation.relationType === 'many-to-many'
            ? []
            : null,
        hidden: false,
      });
    }
  }

  public save(entity: T): T {
    const foundByPrimary = this.entities.find((e) => {
      const primaryName = this.columns.find((c) => c.primary).name;
      return e[primaryName] === entity[primaryName];
    });
    if (foundByPrimary || this.entities.includes(entity)) {
      const savedEntity =
        foundByPrimary ?? this.entities.find((e) => e === entity);
      for (const column of this.columns) {
        if (
          column.unique &&
          this.entities
            .map((e) => e[column.name])
            .includes(entity[column.name]) &&
          entity[column.name] !== undefined &&
          entity[column.name] !== savedEntity[column.name]
        ) {
          throw new QueryFailedError('', [], '');
        } else if (column.mode === 'updateDate') {
          savedEntity[column.name] = new Date();
        } else if (
          column.mode === 'regular' &&
          entity[column.name] !== undefined
        ) {
          savedEntity[column.name] = entity[column.name];
        }
      }
      const selectedColumns = this.columns
        .filter((column) => !column.hidden)
        .map((column) => column.name);
      const selectedEntity = {};
      for (const column of selectedColumns) {
        selectedEntity[column] = savedEntity[column];
      }
      return savedEntity as T;
    } else {
      const newEntity = {};
      for (const column of this.columns) {
        if (
          column.unique &&
          this.entities
            .map((e) => e[column.name])
            .includes(entity[column.name]) &&
          entity[column.name] !== undefined
        ) {
          throw new QueryFailedError('', [], '');
        }
        if (column.generated) {
          newEntity[column.name] = this.generateId();
        } else if (
          column.mode === 'createDate' ||
          column.mode === 'updateDate'
        ) {
          newEntity[column.name] = new Date();
        } else if (column.mode === 'regular') {
          if (entity[column.name] === undefined) {
            if (column.default) {
              newEntity[column.name] = column.default;
            } else {
              if (column.optional) {
                newEntity[column.name] = null;
              } else {
                throw new QueryFailedError('', [], '');
              }
            }
          } else {
            newEntity[column.name] = entity[column.name];
          }
        }
      }
      this.entities.push(newEntity as T);
      const selectedColumns = this.columns
        .filter((column) => !column.hidden)
        .map((column) => column.name);
      const selectedEntity = {};
      for (const column of selectedColumns) {
        selectedEntity[column] = newEntity[column];
      }
      return newEntity as T;
    }
  }

  private generateId() {
    return this.currentId++;
  }

  find(): T[] {
    return this.entities;
  }

  findOne(options: {
    select?: Record<string, boolean>;
    relations?: Record<string, boolean>;
    where?: Record<string, any>;
  }): T | null {
    const foundEntity = this.entities.find((entity) => {
      let good = true;
      for (const [key, value] of Object.entries(options.where)) {
        if (entity[key] !== value) {
          good = false;
        }
      }
      return good;
    });
    if (!foundEntity) {
      return null;
    }
    const selectedColumns = this.columns
      .filter((column) => {
        if (options.select) {
          return options.select[column.name] === true;
        } else {
          return !column.hidden;
        }
      })
      .map((column) => column.name);
    const selectedEntity = {};
    for (const column of selectedColumns) {
      selectedEntity[column] = foundEntity[column];
    }
    return selectedEntity as T;
  }

  delete(where: Record<string, any>): void {
    const foundEntity = this.entities.find((entity) => {
      let good = true;
      for (const [key, value] of Object.entries(where)) {
        if (entity[key] !== value) {
          good = false;
        }
      }
      return good;
    });
    if (foundEntity) {
      this.entities = this.entities.filter((entity) => entity !== foundEntity);
    }
  }

  // private generateValue(type: ColumnType) {
  //   if (typeof type !== 'function') {
  //     return typeof type;
  //   } else {
  //     return typeof type();
  //   }
  // }
  //
  // public generate() {
  //   const object = {};
  //   const columnsToGenerate = getMetadataArgsStorage()
  //     .filterColumns(this.entity)
  //     .filter((c) => c.mode === 'regular' && !c.options.primary);
  //   for (const column of columnsToGenerate) {
  //     object[column.propertyName] = this.generateValue(column.options.type);
  //   }
  //   console.log('GENERATED OBJECT', object);
  // }
}
