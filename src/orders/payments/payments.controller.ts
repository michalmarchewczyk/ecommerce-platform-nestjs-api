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
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ApiOkResponse({
    type: [PaymentMethod],
    description: 'List all payment methods',
  })
  async getMethods(): Promise<PaymentMethod[]> {
    return this.paymentsService.getMethods();
  }

  @Post()
  @Roles(Role.Admin)
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiBadRequestResponse({ description: 'Invalid payment method data' })
  @ApiCreatedResponse({
    type: PaymentMethod,
    description: 'Payment method created',
  })
  async createMethod(
    @Body() methodData: PaymentMethodDto,
  ): Promise<PaymentMethod> {
    return this.paymentsService.createMethod(methodData);
  }

  @Put(':id')
  @Roles(Role.Admin)
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiNotFoundResponse({ description: 'Payment method not found' })
  @ApiBadRequestResponse({ description: 'Invalid payment method data' })
  @ApiOkResponse({ type: PaymentMethod, description: 'Payment method updated' })
  async updateMethod(
    @Param('id', ParseIntPipe) id: number,
    @Body() methodData: PaymentMethodDto,
  ): Promise<PaymentMethod> {
    return await this.paymentsService.updateMethod(id, methodData);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiNotFoundResponse({ description: 'Payment method not found' })
  @ApiOkResponse({ description: 'Payment method deleted' })
  async deleteMethod(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.paymentsService.deleteMethod(id);
  }
}
