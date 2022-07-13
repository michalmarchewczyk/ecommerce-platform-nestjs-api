import { AttributeValueType } from '../entities/attribute-type.entity';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class AttributeTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsEnum(AttributeValueType)
  valueType: AttributeValueType;
}
