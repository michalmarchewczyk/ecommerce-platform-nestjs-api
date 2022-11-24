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
import { AttributeType } from './models/attribute-type.entity';
import { AttributeTypesService } from './attribute-types.service';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../users/models/role.enum';
import { AttributeTypeDto } from './dto/attribute-type.dto';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('attribute types')
@ApiUnauthorizedResponse({ description: 'User not logged in' })
@ApiForbiddenResponse({ description: 'User not authorized' })
@Controller('attribute-types')
export class AttributeTypesController {
  constructor(private readonly attributeTypesService: AttributeTypesService) {}

  @Get()
  @Roles(Role.Admin, Role.Manager)
  @ApiOkResponse({
    type: [AttributeType],
    description: 'List of attribute types',
  })
  async getAttributeTypes(): Promise<AttributeType[]> {
    return this.attributeTypesService.getAttributeTypes();
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
    return this.attributeTypesService.createAttributeType(attributeType);
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
    return await this.attributeTypesService.updateAttributeType(
      id,
      attributeType,
    );
  }

  @Delete('/:id')
  @Roles(Role.Admin, Role.Manager)
  @ApiOkResponse({ description: 'Attribute type deleted' })
  @ApiNotFoundResponse({ description: 'Attribute type not found' })
  async deleteAttributeType(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.attributeTypesService.deleteAttributeType(id);
  }
}
