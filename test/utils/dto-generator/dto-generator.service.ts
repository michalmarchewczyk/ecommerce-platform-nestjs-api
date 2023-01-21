import { Injectable } from '@nestjs/common';
import { getMetadataStorage, ValidationTypes } from 'class-validator';

@Injectable()
export class DtoGeneratorService {
  private validatorMetadata = getMetadataStorage();

  private getPropertiesFromDto(dto: {
    new (): any;
  }): Record<
    string,
    { validators: string[]; isOptional: boolean; ignore: boolean; data?: any }
  > {
    const validationMetadatas =
      this.validatorMetadata.getTargetValidationMetadatas(
        dto,
        '',
        false,
        false,
      );
    const groupedValidationMetadatas =
      this.validatorMetadata.groupByPropertyName(validationMetadatas);
    const properties: Record<string, any> = {};
    for (const [propertyName, validationMetadatas] of Object.entries(
      groupedValidationMetadatas,
    )) {
      const property: Record<string, any> = {
        validators: [],
        isOptional: false,
        ignore: false,
        data: undefined,
      };
      for (const validationMetadata of validationMetadatas) {
        const validator = this.validatorMetadata
          .getTargetValidatorConstraints(validationMetadata.constraintCls)
          .map((c) => c.name);
        property.validators.push(...validator);
        if (
          validationMetadata.type === ValidationTypes.CONDITIONAL_VALIDATION
        ) {
          property.isOptional = true;
        }
        if (validator.includes('isEnum')) {
          property.data = Object.values(validationMetadata.constraints[0]);
        }
        if (validator.includes('isArray') || validator.includes('isObject')) {
          property.ignore = true;
        }
      }
      properties[propertyName] = property;
    }
    return properties;
  }

  private static generateValue(validators: string[], data: any): any {
    if (validators.includes('isEnum')) {
      return data[Math.floor(Math.random() * data.length)];
    }
    if (validators.includes('isEmail')) {
      return `${Math.random().toString(36).substring(2, 15)}@test.local`;
    }
    if (validators.includes('isPhoneNumber')) {
      return '+48 123 456 789';
    }
    if (validators.includes('isISO31661Alpha2')) {
      return 'PL';
    }
    if (validators.includes('isString')) {
      return Math.random().toString(36).substring(2, 15);
    }
    if (validators.includes('isNumber') || validators.includes('IsInt')) {
      return Math.floor(Math.random() * 1_000_000_000);
    }
    if (validators.includes('isBoolean')) {
      return Math.random() > 0.5;
    }
    if (validators.includes('isDate')) {
      return new Date();
    }
  }

  public generate<T>(dto: { new (): T }, full?: boolean, count?: 1): T;
  public generate<T>(dto: { new (): T }, full?: boolean, count?: number): T[];

  public generate<T extends { [key: string]: any }>(
    dto: { new (): T },
    full = false,
    count = 1,
  ): T | T[] {
    if (count !== 1) {
      const entities: T[] = [];
      for (let i = 0; i < count; i++) {
        entities.push(this.generate(dto, full));
      }
      return entities as T[];
    }
    const properties = this.getPropertiesFromDto(dto);
    const entity: { [key: string]: any } = new dto();
    for (const [propertyName, property] of Object.entries(properties)) {
      if ((!property.isOptional || full) && !property.ignore) {
        entity[propertyName] = DtoGeneratorService.generateValue(
          property.validators,
          property.data,
        );
      }
    }
    return entity as T;
  }
}
