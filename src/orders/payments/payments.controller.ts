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
import { PaymentsService } from './payments.service';
import { PaymentMethod } from '../entities/payment-method.entity';
import { PaymentMethodDto } from '../dto/payment-method.dto';
import { Role } from '../../users/entities/role.enum';
import { Roles } from '../../auth/roles.decorator';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('payments')
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
    return await this.paymentsService.updateMethod(id, methodData);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  async deleteMethod(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.paymentsService.deleteMethod(id);
  }
}
