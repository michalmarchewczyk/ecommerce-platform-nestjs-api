import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Return } from './entities/return.entity';
import { Repository } from 'typeorm';
import { ReturnCreateDto } from './dto/return-create.dto';
import { Order } from '../orders/entities/order.entity';
import { ReturnUpdateDto } from './dto/return-update.dto';

@Injectable()
export class ReturnsService {
  constructor(
    @InjectRepository(Return)
    private readonly returnsRepository: Repository<Return>,
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
  ) {}

  async getReturns(): Promise<Return[]> {
    return this.returnsRepository.find();
  }

  async getReturn(id: number): Promise<Return | null> {
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
      return null;
    }
    return foundReturn;
  }

  async checkReturnUser(userId: number, id: number): Promise<boolean> {
    const order = await this.returnsRepository.findOne({
      where: { id, order: { user: { id: userId } } },
      relations: ['order', 'order.user'],
    });
    return !!order;
  }

  async createReturn(returnDto: ReturnCreateDto): Promise<Return | null> {
    const newReturn = new Return();
    const order = await this.ordersRepository.findOne({
      where: { id: returnDto.orderId },
    });
    if (!order) {
      return null;
    }
    try {
      newReturn.order = order;
      newReturn.message = returnDto.message;
      return await this.returnsRepository.save(newReturn);
    } catch (e) {
      return null;
    }
  }

  async updateReturn(
    id: number,
    returnDto: ReturnUpdateDto,
  ): Promise<Return | null> {
    const foundReturn = await this.returnsRepository.findOne({ where: { id } });
    if (!foundReturn) {
      return null;
    }
    Object.assign(foundReturn, returnDto);
    return this.returnsRepository.save(foundReturn);
  }
}
