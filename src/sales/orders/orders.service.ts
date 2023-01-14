import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Order } from './models/order.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderCreateDto } from './dto/order-create.dto';
import { UsersService } from '../../users/users.service';
import { ProductsService } from '../../catalog/products/products.service';
import { OrderUpdateDto } from './dto/order-update.dto';
import { OrderItem } from './models/order-item.entity';
import { OrderDelivery } from './models/order-delivery.entity';
import { DeliveryMethodsService } from '../delivery-methods/delivery-methods.service';
import { PaymentMethodsService } from '../payment-methods/payment-methods.service';
import { OrderPayment } from './models/order-payment.entity';
import { NotFoundError } from '../../errors/not-found.error';
import { Role } from '../../users/models/role.enum';
import { OrderItemDto } from './dto/order-item.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    private readonly usersService: UsersService,
    private readonly productsService: ProductsService,
    private readonly deliveryMethodsService: DeliveryMethodsService,
    private readonly paymentMethodsService: PaymentMethodsService,
  ) {}

  async getOrders(withUser = false, withProducts = false): Promise<Order[]> {
    return this.ordersRepository.find({
      relations: [
        ...(withUser ? ['user'] : []),
        'items',
        ...(withProducts ? ['items.product'] : []),
        'delivery',
        'payment',
        'return',
      ],
    });
  }

  async getUserOrders(userId: number): Promise<Order[]> {
    return this.ordersRepository.find({
      where: { user: { id: userId } },
      relations: [
        'user',
        'items',
        'items.product',
        'delivery',
        'payment',
        'return',
      ],
    });
  }

  async getOrder(id: number): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: [
        'user',
        'items',
        'items.product',
        'delivery',
        'payment',
        'return',
      ],
    });
    if (!order) {
      throw new NotFoundError('order', 'id', id.toString());
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

  async createOrder(
    userId: number | null,
    orderData: OrderCreateDto,
    ignoreSubscribers = false,
  ): Promise<Order> {
    const order = new Order();
    if (userId) {
      order.user = await this.usersService.getUser(userId);
    }
    order.items = await this.getItems(order, orderData.items);
    order.fullName = orderData.fullName;
    order.contactEmail = orderData.contactEmail;
    order.contactPhone = orderData.contactPhone;
    order.message = orderData.message;
    const deliveryMethod = await this.deliveryMethodsService.getMethod(
      orderData.delivery.methodId,
    );
    const delivery = new OrderDelivery();
    Object.assign(delivery, orderData.delivery);
    order.delivery = delivery;
    order.delivery.method = deliveryMethod;
    const paymentMethod = await this.paymentMethodsService.getMethod(
      orderData.payment.methodId,
    );
    const payment = new OrderPayment();
    Object.assign(payment, orderData.payment);
    order.payment = payment;
    order.payment.method = paymentMethod;
    return this.ordersRepository.save(order, { listeners: !ignoreSubscribers });
  }

  private async getItems(order: Order, items: OrderItemDto[]) {
    const res = [];
    for (const item of items) {
      const product = await this.productsService.getProduct(
        item.productId,
        order.user &&
          [Role.Admin, Role.Manager, Role.Sales].includes(order.user.role),
      );
      res.push({
        product,
        quantity: item.quantity,
        price: product.price,
      } as OrderItem);
    }
    return res;
  }

  async updateOrder(
    id: number,
    orderData: OrderUpdateDto,
    ignoreSubscribers = false,
  ): Promise<Order> {
    const order = await this.getOrder(id);
    if (orderData.items) {
      order.items = await this.getItems(order, orderData.items);
    }
    if (orderData.delivery) {
      const deliveryMethod = await this.deliveryMethodsService.getMethod(
        orderData.delivery.methodId,
      );
      Object.assign(order.delivery, orderData.delivery);
      order.delivery.method = deliveryMethod;
    }
    if (orderData.payment) {
      const paymentMethod = await this.paymentMethodsService.getMethod(
        orderData.payment.methodId,
      );
      Object.assign(order.payment, orderData.payment);
      order.payment.method = paymentMethod;
    }
    const { delivery, payment, items, ...toAssign } = orderData;
    Object.assign(order, toAssign);
    return this.ordersRepository.save(order, { listeners: !ignoreSubscribers });
  }

  async deleteOrder(id: number): Promise<void> {
    await this.getOrder(id);
    await this.ordersRepository.delete({ id });
    return;
  }
}
