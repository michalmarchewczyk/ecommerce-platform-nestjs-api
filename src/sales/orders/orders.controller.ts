import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Role } from '../../users/models/role.enum';
import { OrdersService } from './orders.service';
import { OrderCreateDto } from './dto/order-create.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ReqUser } from '../../auth/decorators/user.decorator';
import { User } from '../../users/models/user.entity';
import { OrderUpdateDto } from './dto/order-update.dto';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Order } from './models/order.entity';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiCreatedResponse({ type: Order, description: 'Order created' })
  @ApiBadRequestResponse({ description: 'Invalid order data' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  async createOrder(
    @ReqUser() user: User | null,
    @Body() body: OrderCreateDto,
  ): Promise<Order> {
    return await this.ordersService.createOrder(user?.id ?? null, body);
  }

  @Get()
  @Roles(Role.Admin, Role.Manager, Role.Sales)
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiOkResponse({ type: [Order], description: 'List of all orders' })
  async getOrders(): Promise<Order[]> {
    return this.ordersService.getOrders();
  }

  @Get('/my')
  @Roles(Role.Admin, Role.Manager, Role.Sales, Role.Customer)
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiOkResponse({
    type: [Order],
    description: "List of current user's orders",
  })
  async getUserOrders(@ReqUser() user: User): Promise<Order[]> {
    return await this.ordersService.getUserOrders(user.id);
  }

  @Get('/:id')
  @Roles(Role.Admin, Role.Manager, Role.Sales, Role.Customer)
  @ApiNotFoundResponse({ description: 'Order not found' })
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiOkResponse({ type: Order, description: 'Order with given id' })
  async getOrder(
    @ReqUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Order> {
    const checkUser = await this.ordersService.checkOrderUser(user.id, id);
    if (!checkUser && user.role === Role.Customer) {
      throw new ForbiddenException();
    }
    return await this.ordersService.getOrder(id);
  }

  @Patch('/:id')
  @Roles(Role.Admin, Role.Manager, Role.Sales)
  @ApiBadRequestResponse({ description: 'Invalid order data' })
  @ApiNotFoundResponse({ description: 'Order not found' })
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiOkResponse({ type: Order, description: 'Order updated' })
  async updateOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: OrderUpdateDto,
  ): Promise<Order> {
    return await this.ordersService.updateOrder(id, body);
  }
}
