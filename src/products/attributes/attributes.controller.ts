import {
  Body,
  Controller,
  Delete,
  Get,
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
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('attributes')
@ApiUnauthorizedResponse({ description: 'User not logged in' })
@ApiForbiddenResponse({ description: 'User not authorized' })
@Controller('attributes')
export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  @Get()
  @Roles(Role.Admin, Role.Manager)
  @ApiOkResponse({
    type: [AttributeType],
    description: 'List of attribute types',
  })
  async getAttributeTypes(): Promise<AttributeType[]> {
    return this.attributesService.getAttributeTypes();
  }

  @Post()
  @Roles(Role.Admin, Role.Manager)
  @ApiCreatedResponse({
    type: AttributeType,
    description: 'Attribute type created',
  })
  @ApiBadRequestResponse({ description: 'Invalid attribute type data' })
  async createAttributeType(
    @Body() attributeType: AttributeTypeDto,
  ): Promise<AttributeType> {
    return this.attributesService.createAttributeType(attributeType);
  }

  @Put('/:id')
  @Roles(Role.Admin, Role.Manager)
  @ApiOkResponse({ type: AttributeType, description: 'Attribute type updated' })
  @ApiNotFoundResponse({ description: 'Attribute type not found' })
  @ApiBadRequestResponse({ description: 'Invalid attribute type data' })
  async updateAttributeType(
    @Param('id', ParseIntPipe) id: number,
    @Body() attributeType: AttributeTypeDto,
  ): Promise<AttributeType> {
    return await this.attributesService.updateAttributeType(id, attributeType);
  }

  @Delete('/:id')
  @Roles(Role.Admin, Role.Manager)
  @ApiOkResponse({ description: 'Attribute type deleted' })
  @ApiNotFoundResponse({ description: 'Attribute type not found' })
  async deleteAttributeType(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.attributesService.deleteAttributeType(id);
  }
}
