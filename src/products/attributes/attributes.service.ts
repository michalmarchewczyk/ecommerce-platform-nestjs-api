import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AttributeType } from '../entities/attribute-type.entity';
import { Repository } from 'typeorm';
import { AttributeTypeDto } from '../dto/attribute-type.dto';

@Injectable()
export class AttributesService {
  constructor(
    @InjectRepository(AttributeType)
    readonly attributeTypesRepository: Repository<AttributeType>,
  ) {}

  async getAttributeTypes(): Promise<AttributeType[]> {
    return this.attributeTypesRepository.find();
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
  ): Promise<AttributeType | null> {
    const attributeType = await this.attributeTypesRepository.findOne({
      where: { id: attributeTypeId },
    });
    if (!attributeType) {
      return null;
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
      return false;
    }
    await this.attributeTypesRepository.delete({ id: attributeTypeId });
    return true;
  }
}
