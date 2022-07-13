import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { AttributeType } from '../entities/attribute-type.entity';
import { AttributesService } from './attributes.service';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '../../users/entities/role.enum';
import { AttributeTypeDto } from '../dto/attribute-type.dto';

@Controller('attributes')
export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  @Get()
  @Roles(Role.Admin, Role.Manager)
  async getAttributeTypes(): Promise<AttributeType[]> {
    return this.attributesService.getAttributeTypes();
  }

  @Post()
  @Roles(Role.Admin, Role.Manager)
  async createAttributeType(
    @Body() attributeType: AttributeTypeDto,
  ): Promise<AttributeType> {
    return this.attributesService.createAttributeType(attributeType);
  }

  @Put('/:id')
  @Roles(Role.Admin, Role.Manager)
  async updateAttributeType(
    @Param('id', ParseIntPipe) id: number,
    @Body() attributeType: AttributeTypeDto,
  ): Promise<AttributeType> {
    const updatedAttributeType =
      await this.attributesService.updateAttributeType(id, attributeType);
    if (!updatedAttributeType) {
      throw new NotFoundException(['attribute type not found']);
    }
    return updatedAttributeType;
  }

  @Delete('/:id')
  @Roles(Role.Admin, Role.Manager)
  async deleteAttributeType(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    const deletedAttributeType =
      await this.attributesService.deleteAttributeType(id);
    if (!deletedAttributeType) {
      throw new NotFoundException(['attribute type not found']);
    }
    return;
  }
}