import { Injectable } from '@nestjs/common';
import { Exporter } from '../../import-export/models/exporter.interface';
import { Order } from './models/order.entity';
import { OrdersService } from './orders.service';
import { OrderDelivery } from './models/order-delivery.entity';
import { OrderPayment } from './models/order-payment.entity';
import { OrderItem } from './models/order-item.entity';

@Injectable()
export class OrdersExporter implements Exporter<Order> {
  constructor(private ordersService: OrdersService) {}

  async export(): Promise<Order[]> {
    const orders = await this.ordersService.getOrders(true, true);
    const preparedOrders: Order[] = [];
    for (const order of orders) {
      preparedOrders.push(this.prepareOrder(order));
    }
    return preparedOrders;
  }

  private prepareOrder(order: Order) {
    const preparedOrder = new Order() as any;
    preparedOrder.id = order.id;
    preparedOrder.created = order.created;
    preparedOrder.updated = order.updated;
    preparedOrder.userId = order.user?.id ?? null;
    preparedOrder.status = order.status;
    preparedOrder.fullName = order.fullName;
    preparedOrder.contactPhone = order.contactPhone;
    preparedOrder.contactEmail = order.contactEmail;
    preparedOrder.message = order.message;
    preparedOrder.delivery = this.prepareOrderDelivery(order.delivery);
    preparedOrder.payment = this.prepareOrderPayment(order.payment);
    preparedOrder.items = order.items.map((item) =>
      this.prepareOrderItem(item),
    );
    return preparedOrder;
  }

  private prepareOrderDelivery(delivery: OrderDelivery) {
    const preparedDelivery = new OrderDelivery() as any;
    preparedDelivery.methodId = delivery.method.id;
    preparedDelivery.deliveryStatus = delivery.deliveryStatus;
    preparedDelivery.address = delivery.address;
    preparedDelivery.city = delivery.city;
    preparedDelivery.postalCode = delivery.postalCode;
    preparedDelivery.country = delivery.country;
    return preparedDelivery;
  }

  private prepareOrderPayment(payment: OrderPayment) {
    const preparedPayment = new OrderPayment() as any;
    preparedPayment.methodId = payment.method.id;
    preparedPayment.paymentStatus = payment.paymentStatus;
    return preparedPayment;
  }

  private prepareOrderItem(item: OrderItem) {
    const preparedItem = new OrderItem() as any;
    preparedItem.productId = item.product.id;
    preparedItem.quantity = item.quantity;
    preparedItem.price = item.price;
    return preparedItem;
  }
}
