import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Return } from './models/return.entity';
import { Repository } from 'typeorm';
import { ReturnCreateDto } from './dto/return-create.dto';
import { ReturnUpdateDto } from './dto/return-update.dto';
import { NotFoundError } from '../../errors/not-found.error';
import { ConflictError } from '../../errors/conflict.error';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class ReturnsService {
  constructor(
    @InjectRepository(Return)
    private readonly returnsRepository: Repository<Return>,
    private ordersService: OrdersService,
  ) {}

  async getReturns(): Promise<Return[]> {
    return this.returnsRepository.find({
      relations: ['order', 'order.items'],
    });
  }

  async getReturn(id: number): Promise<Return> {
    const foundReturn = await this.returnsRepository.findOne({
      where: { id },
      relations: [
        'order',
        'order.user',
        'order.items',
        'order.items.product',
        'order.delivery',
        'order.payment',
      ],
    });
    if (!foundReturn) {
      throw new NotFoundError('return', 'id', id.toString());
    }
    return foundReturn;
  }

  async checkReturnUser(userId: number, id: number): Promise<boolean> {
    const foundReturn = await this.returnsRepository.findOne({
      where: { id, order: { user: { id: userId } } },
      relations: ['order', 'order.user'],
    });
    return !!foundReturn;
  }

  async createReturn(
    returnDto: ReturnCreateDto,
    ignoreSubscribers = false,
  ): Promise<Return> {
    const newReturn = new Return();
    const order = await this.ordersService.getOrder(returnDto.orderId);
    try {
      newReturn.order = order;
      newReturn.message = returnDto.message;
      return await this.returnsRepository.save(newReturn, {
        listeners: !ignoreSubscribers,
      });
    } catch (e) {
      throw new ConflictError('return');
    }
  }

  async updateReturn(
    id: number,
    returnDto: ReturnUpdateDto,
    ignoreSubscribers = false,
  ): Promise<Return> {
    const foundReturn = await this.getReturn(id);
    Object.assign(foundReturn, returnDto);
    return this.returnsRepository.save(foundReturn, {
      listeners: !ignoreSubscribers,
    });
  }

  async deleteReturn(id: number): Promise<boolean> {
    await this.getReturn(id);
    await this.returnsRepository.delete({ id });
    return true;
  }
}
