import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Role } from '../users/entities/role.enum';
import { OrdersService } from './orders.service';
import { OrderCreateDto } from './dto/order-create.dto';
import { Roles } from '../auth/roles.decorator';
import { ReqUser } from '../auth/user.decorator';
import { User } from '../users/entities/user.entity';
import { OrderUpdateDto } from './dto/order-update.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async createOrder(@ReqUser() user: User, @Body() body: OrderCreateDto) {
    return this.ordersService.createOrder(user?.id, body);
  }

  @Get()
  @Roles(Role.Admin, Role.Manager, Role.Sales)
  async getOrders() {
    return this.ordersService.getOrders();
  }

  @Get('/:id')
  @Roles(Role.Admin, Role.Manager, Role.Sales, Role.Customer)
  async getOrder(@ReqUser() user: User, @Param('id', ParseIntPipe) id: number) {
    const checkUser = await this.ordersService.checkOrderUser(user?.id, id);
    if (!checkUser && user?.role === Role.Customer) {
      throw new ForbiddenException();
    }
    const order = await this.ordersService.getOrder(id);
    if (!order) {
      throw new NotFoundException(['order not found']);
    }
    return order;
  }

  @Patch('/:id')
  @Roles(Role.Admin, Role.Manager, Role.Sales)
  async updateOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: OrderUpdateDto,
  ) {
    const order = await this.ordersService.updateOrder(id, body);
    if (!order) {
      throw new NotFoundException(['order not found']);
    }
    return order;
  }
}
