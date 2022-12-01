import { Injectable } from '@nestjs/common';
import { Exporter } from '../../import-export/models/exporter.interface';
import { AttributeType } from './models/attribute-type.entity';
import { AttributeTypesService } from './attribute-types.service';

@Injectable()
export class AttributeTypesExporter implements Exporter<AttributeType> {
  constructor(private attributeTypesService: AttributeTypesService) {}

  async export(): Promise<AttributeType[]> {
    const attributeTypes = await this.attributeTypesService.getAttributeTypes();
    const preparedAttributeTypes: AttributeType[] = [];
    for (const attributeType of attributeTypes) {
      preparedAttributeTypes.push(this.prepareAttributeType(attributeType));
    }
    return preparedAttributeTypes;
  }

  private prepareAttributeType(attributeType: AttributeType) {
    const preparedAttributeType = new AttributeType();
    preparedAttributeType.id = attributeType.id;
    preparedAttributeType.name = attributeType.name;
    preparedAttributeType.valueType = attributeType.valueType;
    return preparedAttributeType;
  }
}
