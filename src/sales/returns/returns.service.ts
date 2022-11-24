import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Return } from './models/return.entity';
import { Repository } from 'typeorm';
import { ReturnCreateDto } from './dto/return-create.dto';
import { Order } from '../orders/models/order.entity';
import { ReturnUpdateDto } from './dto/return-update.dto';
import { NotFoundError } from '../../errors/not-found.error';
import { ConflictError } from '../../errors/conflict.error';

@Injectable()
export class ReturnsService {
  constructor(
    @InjectRepository(Return)
    private readonly returnsRepository: Repository<Return>,
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
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

  async checkOrderUser(userId: number, orderId: number): Promise<boolean> {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId, user: { id: userId } },
    });
    return !!order;
  }

  async createReturn(returnDto: ReturnCreateDto): Promise<Return> {
    const newReturn = new Return();
    const order = await this.ordersRepository.findOne({
      where: { id: returnDto.orderId },
      relations: ['items'],
    });
    if (!order) {
      throw new NotFoundError('order', 'id', returnDto.orderId.toString());
    }
    try {
      newReturn.order = order;
      newReturn.message = returnDto.message;
      return await this.returnsRepository.save(newReturn);
    } catch (e) {
      throw new ConflictError('return');
    }
  }

  async updateReturn(id: number, returnDto: ReturnUpdateDto): Promise<Return> {
    const foundReturn = await this.returnsRepository.findOne({
      where: { id },
      relations: ['order'],
    });
    if (!foundReturn) {
      throw new NotFoundError('return', 'id', id.toString());
    }
    Object.assign(foundReturn, returnDto);
    return this.returnsRepository.save(foundReturn);
  }
}
