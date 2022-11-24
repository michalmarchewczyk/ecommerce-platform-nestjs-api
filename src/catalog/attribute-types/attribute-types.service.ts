import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AttributeType } from './models/attribute-type.entity';
import { Repository } from 'typeorm';
import { AttributeTypeDto } from './dto/attribute-type.dto';
import { NotFoundError } from '../../errors/not-found.error';
import { AttributeValueType } from './models/attribute-value-type.enum';
import {
  isBooleanString,
  isHexColor,
  isNumberString,
  isString,
} from 'class-validator';
import { TypeCheckError } from '../../errors/type-check.error';

@Injectable()
export class AttributeTypesService {
  constructor(
    @InjectRepository(AttributeType)
    readonly attributeTypesRepository: Repository<AttributeType>,
  ) {}

  async getAttributeTypes(): Promise<AttributeType[]> {
    return this.attributeTypesRepository.find();
  }

  async getAttributeType(id: number): Promise<AttributeType> {
    const attributeType = await this.attributeTypesRepository.findOne({
      where: { id },
    });
    if (!attributeType) {
      throw new NotFoundError('attribute type', 'id', id.toString());
    }
    return attributeType;
  }

  async createAttributeType(
    attributeTypeData: AttributeTypeDto,
  ): Promise<AttributeType> {
    const attributeType = new AttributeType();
    attributeType.name = attributeTypeData.name;
    attributeType.valueType = attributeTypeData.valueType;
    return this.attributeTypesRepository.save(attributeType);
  }

  async updateAttributeType(
    attributeTypeId: number,
    attributeTypeData: AttributeTypeDto,
  ): Promise<AttributeType> {
    const attributeType = await this.attributeTypesRepository.findOne({
      where: { id: attributeTypeId },
    });
    if (!attributeType) {
      throw new NotFoundError('attribute type');
    }
    attributeType.name = attributeTypeData.name;
    attributeType.valueType = attributeTypeData.valueType;
    return this.attributeTypesRepository.save(attributeType);
  }

  async deleteAttributeType(attributeTypeId: number): Promise<boolean> {
    const attributeType = await this.attributeTypesRepository.findOne({
      where: { id: attributeTypeId },
    });
    if (!attributeType) {
      throw new NotFoundError('attribute type');
    }
    await this.attributeTypesRepository.delete({ id: attributeTypeId });
    return true;
  }

  async checkAttributeType(type: AttributeValueType, value: string) {
    (<[AttributeValueType, (value: any) => boolean][]>[
      [AttributeValueType.String, isString],
      [AttributeValueType.Number, isNumberString],
      [AttributeValueType.Boolean, isBooleanString],
      [AttributeValueType.Color, isHexColor],
    ]).forEach((check) => {
      if (type === check[0] && !check[1](value)) {
        throw new TypeCheckError('attribute value', check[0]);
      }
    });
  }
}
