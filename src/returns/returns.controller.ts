import {
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { OrdersService } from '../orders/orders.service';
import { Role } from 'src/users/entities/role.enum';
import { Roles } from '../auth/roles.decorator';
import { Return } from './entities/return.entity';
import { User } from '../users/entities/user.entity';
import { ReqUser } from '../auth/user.decorator';
import { ReturnCreateDto } from './dto/return-create.dto';
import { ReturnUpdateDto } from './dto/return-update.dto';

@Controller('returns')
export class ReturnsController {
  constructor(
    private readonly returnsService: ReturnsService,
    private readonly ordersService: OrdersService,
  ) {}

  @Get()
  @Roles(Role.Admin, Role.Manager, Role.Sales)
  async getReturns(): Promise<Return[]> {
    return this.returnsService.getReturns();
  }

  @Get('/:id')
  @Roles(Role.Admin, Role.Manager, Role.Sales, Role.Customer)
  async getReturn(
    @ReqUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Return> {
    const checkUser = await this.returnsService.checkReturnUser(user?.id, id);
    if (!checkUser && user?.role === Role.Customer) {
      throw new ForbiddenException();
    }
    const foundReturn = await this.returnsService.getReturn(id);
    if (!foundReturn) {
      throw new NotFoundException(['return not found']);
    }
    return foundReturn;
  }

  @Post('')
  async createReturn(
    @ReqUser() user: User,
    @Body() body: ReturnCreateDto,
  ): Promise<Return> {
    const checkUser = await this.ordersService.checkOrderUser(
      user?.id,
      body.orderId,
    );
    if (!checkUser && (!user?.role || user?.role === Role.Customer)) {
      throw new ForbiddenException();
    }
    const created = await this.returnsService.createReturn(body);
    if (!created) {
      throw new ConflictException(['return for given order already exists']);
    }
    return created;
  }

  @Patch('/:id')
  async updateReturn(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ReturnUpdateDto,
  ): Promise<Return> {
    return this.returnsService.updateReturn(id, body);
  }
}
