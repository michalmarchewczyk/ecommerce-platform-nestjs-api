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
import { ApiTags } from '@nestjs/swagger';

@ApiTags('deliveries')
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
    return await this.deliveriesService.updateMethod(id, body);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  async deleteMethod(@Param('id') id: number): Promise<void> {
    await this.deliveriesService.deleteMethod(id);
  }
}
