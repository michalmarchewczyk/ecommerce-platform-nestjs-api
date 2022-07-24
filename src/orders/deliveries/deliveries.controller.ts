import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { DeliveryMethod } from '../entities/delivery-method.entity';
import { DeliveryMethodDto } from '../dto/delivery-method.dto';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '../../users/entities/role.enum';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('deliveries')
@Controller('deliveries')
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Get()
  @ApiOkResponse({
    type: [DeliveryMethod],
    description: 'List all delivery methods',
  })
  async getMethods(): Promise<DeliveryMethod[]> {
    return this.deliveriesService.getMethods();
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
  async createMethod(@Body() body: DeliveryMethodDto): Promise<DeliveryMethod> {
    return this.deliveriesService.createMethod(body);
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
  async updateMethod(
    @Param('id') id: number,
    @Body() body: DeliveryMethodDto,
  ): Promise<DeliveryMethod> {
    return await this.deliveriesService.updateMethod(id, body);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiNotFoundResponse({ description: 'Delivery method not found' })
  @ApiOkResponse({ description: 'Delivery method deleted' })
  async deleteMethod(@Param('id') id: number): Promise<void> {
    await this.deliveriesService.deleteMethod(id);
  }
}
