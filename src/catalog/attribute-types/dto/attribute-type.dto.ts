import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { AttributeValueType } from '../models/attribute-value-type.enum';

export class AttributeTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsEnum(AttributeValueType)
  valueType: AttributeValueType;
}
