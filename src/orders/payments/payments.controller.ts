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
import { PaymentsService } from './payments.service';
import { PaymentMethod } from '../entities/payment-method.entity';
import { PaymentMethodDto } from '../dto/payment-method.dto';
import { Role } from '../../users/entities/role.enum';
import { Roles } from '../../auth/roles.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  async getMethods(): Promise<PaymentMethod[]> {
    return this.paymentsService.getMethods();
  }

  @Post()
  @Roles(Role.Admin)
  async createMethod(
    @Body() methodData: PaymentMethodDto,
  ): Promise<PaymentMethod> {
    return this.paymentsService.createMethod(methodData);
  }

  @Put(':id')
  @Roles(Role.Admin)
  async updateMethod(
    @Param('id', ParseIntPipe) id: number,
    @Body() methodData: PaymentMethodDto,
  ): Promise<PaymentMethod | null> {
    const updated = await this.paymentsService.updateMethod(id, methodData);
    if (!updated) {
      throw new NotFoundException(['payment method not found']);
    }
    return updated;
  }

  @Delete(':id')
  @Roles(Role.Admin)
  async deleteMethod(@Param('id', ParseIntPipe) id: number): Promise<void> {
    const deleted = await this.paymentsService.deleteMethod(id);
    if (!deleted) {
      throw new NotFoundException(['payment method not found']);
    }
    return;
  }
}
