import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderCreateDto } from './dto/order-create.dto';
import { UsersService } from '../users/users.service';
import { ProductsService } from '../products/products.service';
import { OrderUpdateDto } from './dto/order-update.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    private readonly usersService: UsersService,
    private readonly productsService: ProductsService,
  ) {}

  async getOrders(): Promise<Order[]> {
    return this.ordersRepository.find();
  }

  async getOrder(id: number): Promise<Order | null> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['user', 'products'],
    });
    if (!order) {
      return null;
    }
    return order;
  }

  async checkOrderUser(userId: number, id: number): Promise<boolean> {
    const order = await this.ordersRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['user'],
    });
    return !!order;
  }

  async createOrder(userId: number, orderData: OrderCreateDto): Promise<Order> {
    const order = new Order();
    if (userId) {
      order.user = await this.usersService.getUser(userId);
    }
    order.products = await this.productsService.getProductsByIds(
      orderData.productIds,
    );
    order.fullName = orderData.fullName;
    order.contactEmail = orderData.contactEmail;
    order.contactPhone = orderData.contactPhone;
    order.message = orderData.message;
    return this.ordersRepository.save(order);
  }

  async updateOrder(
    id: number,
    orderData: OrderUpdateDto,
  ): Promise<Order | null> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['user', 'products'],
    });
    if (!order) {
      return null;
    }
    if (orderData.productIds) {
      order.products = await this.productsService.getProductsByIds(
        orderData.productIds,
      );
    }
    Object.assign(order, orderData);
    return this.ordersRepository.save(order);
  }
}