import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { DeliveryMethod } from '../entities/delivery-method.entity';
import { DeliveryMethodDto } from '../dto/delivery-method.dto';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '../../users/entities/role.enum';

@Controller('deliveries')
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Get()
  async getMethods(): Promise<DeliveryMethod[]> {
    return this.deliveriesService.getMethods();
  }

  @Post()
  @Roles(Role.Admin)
  async createMethod(@Body() body: DeliveryMethodDto): Promise<DeliveryMethod> {
    return this.deliveriesService.createMethod(body);
  }

  @Put(':id')
  @Roles(Role.Admin)
  async updateMethod(
    @Param('id') id: number,
    @Body() body: DeliveryMethodDto,
  ): Promise<DeliveryMethod> {
    const updated = await this.deliveriesService.updateMethod(id, body);
    if (!updated) {
      throw new NotFoundException(['delivery method not found']);
    }
    return updated;
  }

  @Delete(':id')
  @Roles(Role.Admin)
  async deleteMethod(@Param('id') id: number): Promise<void> {
    const deleted = await this.deliveriesService.deleteMethod(id);
    if (!deleted) {
      throw new NotFoundException(['delivery method not found']);
    }
    return;
  }
}
