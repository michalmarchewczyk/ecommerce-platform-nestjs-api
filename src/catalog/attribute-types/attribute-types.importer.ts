import { Injectable } from '@nestjs/common';
import { AttributeTypesService } from './attribute-types.service';
import { Importer } from '../../import-export/models/importer.interface';
import { Collection } from '../../import-export/models/collection.type';
import { AttributeType } from './models/attribute-type.entity';
import { ParseError } from '../../errors/parse.error';
import { AttributeValueType } from './models/attribute-value-type.enum';
import { IdMap } from '../../import-export/models/id-map.type';

@Injectable()
export class AttributeTypesImporter implements Importer {
  constructor(private attributeTypesService: AttributeTypesService) {}

  async import(attributeTypes: Collection): Promise<IdMap> {
    const parsedAttributeTypes = this.parseAttributeTypes(attributeTypes);
    const idMap: IdMap = {};
    for (const attributeType of parsedAttributeTypes) {
      const { id: newId } =
        await this.attributeTypesService.createAttributeType(attributeType);
      idMap[attributeType.id] = newId;
    }
    return idMap;
  }

  async clear() {
    return 0;
  }

  private parseAttributeTypes(attributeTypes: Collection) {
    const parsedAttributeTypes: AttributeType[] = [];
    for (const attributeType of attributeTypes) {
      parsedAttributeTypes.push(this.parseAttributeType(attributeType));
    }
    return parsedAttributeTypes;
  }

  private parseAttributeType(attributeType: Collection[number]) {
    const parsedAttributeType = new AttributeType();
    try {
      parsedAttributeType.id = attributeType.id as number;
      parsedAttributeType.name = attributeType.name as string;
      parsedAttributeType.valueType =
        attributeType.valueType as AttributeValueType;
    } catch (e) {
      throw new ParseError('attributeType');
    }
    return parsedAttributeType;
  }
}
