import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AttributeType } from './models/attribute-type.entity';
import { Repository } from 'typeorm';
import { AttributeTypeDto } from './dto/attribute-type.dto';
import { NotFoundError } from '../../errors/not-found.error';

@Injectable()
export class AttributeTypesService {
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
}
