import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderCreateDto } from './dto/order-create.dto';
import { UsersService } from '../users/users.service';
import { ProductsService } from '../products/products.service';
import { OrderUpdateDto } from './dto/order-update.dto';
import { OrderItem } from './entities/order-item.entity';
import { OrderDelivery } from './entities/order-delivery.entity';
import { DeliveriesService } from './deliveries/deliveries.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    private readonly usersService: UsersService,
    private readonly productsService: ProductsService,
    private readonly deliveriesService: DeliveriesService,
  ) {}

  async getOrders(): Promise<Order[]> {
    return this.ordersRepository.find();
  }

  async getOrder(id: number): Promise<Order | null> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['user', 'items', 'items.product', 'delivery'],
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
    order.items = [];
    for (const item of orderData.items) {
      const product = await this.productsService.getProduct(item.productId);
      if (!product) {
        return null;
      }
      order.items.push({
        product,
        quantity: item.quantity,
        price: product.price,
      } as OrderItem);
    }
    order.fullName = orderData.fullName;
    order.contactEmail = orderData.contactEmail;
    order.contactPhone = orderData.contactPhone;
    order.message = orderData.message;
    const method = await this.deliveriesService.getMethod(
      orderData.delivery.methodId,
    );
    if (!method) {
      return null;
    }
    const delivery = new OrderDelivery();
    Object.assign(delivery, orderData.delivery);
    order.delivery = delivery;
    order.delivery.method = method;
    return this.ordersRepository.save(order);
  }

  async updateOrder(
    id: number,
    orderData: OrderUpdateDto,
  ): Promise<Order | null> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['user', 'items', 'items.product', 'delivery'],
    });
    if (!order) {
      return null;
    }
    if (orderData.items) {
      order.items = [];
      for (const item of orderData.items) {
        const product = await this.productsService.getProduct(item.productId);
        if (!product) {
          return null;
        }
        order.items.push({
          product,
          quantity: item.quantity,
          price: product.price,
        } as OrderItem);
      }
    }
    if (orderData.delivery) {
      const method = await this.deliveriesService.getMethod(
        orderData.delivery.methodId,
      );
      if (!method) {
        return null;
      }
      Object.assign(order.delivery, orderData.delivery);
      order.delivery.method = method;
    }
    const { delivery, items, ...toAssign } = orderData;
    Object.assign(order, toAssign);
    return this.ordersRepository.save(order);
  }
}
