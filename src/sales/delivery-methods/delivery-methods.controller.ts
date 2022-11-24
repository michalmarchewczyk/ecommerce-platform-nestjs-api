import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { DeliveryMethodsService } from './delivery-methods.service';
import { DeliveryMethod } from './models/delivery-method.entity';
import { DeliveryMethodDto } from './dto/delivery-method.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../users/models/role.enum';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('delivery methods')
@Controller('delivery-methods')
export class DeliveryMethodsController {
  constructor(
    private readonly deliveryMethodsService: DeliveryMethodsService,
  ) {}

  @Get()
  @ApiOkResponse({
    type: [DeliveryMethod],
    description: 'List all delivery methods',
  })
  async getDeliveryMethods(): Promise<DeliveryMethod[]> {
    return this.deliveryMethodsService.getMethods();
  }

  @Post()
  @Roles(Role.Admin)
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiBadRequestResponse({ description: 'Invalid delivery method data' })
  @ApiCreatedResponse({
    type: DeliveryMethod,
    description: 'Delivery method created',
  })
  async createDeliveryMethod(
    @Body() body: DeliveryMethodDto,
  ): Promise<DeliveryMethod> {
    return this.deliveryMethodsService.createMethod(body);
  }

  @Put(':id')
  @Roles(Role.Admin)
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiNotFoundResponse({ description: 'Delivery method not found' })
  @ApiBadRequestResponse({ description: 'Invalid delivery method data' })
  @ApiOkResponse({
    type: DeliveryMethod,
    description: 'Delivery method updated',
  })
  async updateDeliveryMethod(
    @Param('id') id: number,
    @Body() body: DeliveryMethodDto,
  ): Promise<DeliveryMethod> {
    return await this.deliveryMethodsService.updateMethod(id, body);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiNotFoundResponse({ description: 'Delivery method not found' })
  @ApiOkResponse({ description: 'Delivery method deleted' })
  async deleteDeliveryMethod(@Param('id') id: number): Promise<void> {
    await this.deliveryMethodsService.deleteMethod(id);
  }
}
