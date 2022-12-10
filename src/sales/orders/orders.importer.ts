import { Injectable } from '@nestjs/common';
import { Importer } from '../../import-export/models/importer.interface';
import { Collection } from '../../import-export/models/collection.type';
import { ParseError } from '../../errors/parse.error';
import { IdMap } from '../../import-export/models/id-map.type';
import { OrdersService } from './orders.service';
import { Order } from './models/order.entity';
import { OrderStatus } from './models/order-status.enum';
import { OrderDeliveryDto } from './dto/order-delivery.dto';
import { OrderCreateDto } from './dto/order-create.dto';
import { OrderPaymentDto } from './dto/order-payment.dto';
import { OrderItemDto } from './dto/order-item.dto';

@Injectable()
export class OrdersImporter implements Importer {
  constructor(private ordersService: OrdersService) {}

  async import(
    orders: Collection,
    idMaps: Record<string, IdMap>,
  ): Promise<IdMap> {
    const parsedOrders = this.parseOrders(orders, idMaps);
    const idMap: IdMap = {};
    for (const order of parsedOrders) {
      const { user, status, ...createDto } = order as any;
      const { id: newId } = await this.ordersService.createOrder(
        user.id ?? null,
        createDto,
        true,
      );
      await this.ordersService.updateOrder(newId, { status }, true);
      idMap[order.id] = newId;
    }
    return idMap;
  }

  async clear() {
    const orders = await this.ordersService.getOrders();
    let deleted = 0;
    for (const order of orders) {
      await this.ordersService.deleteOrder(order.id);
      deleted += 1;
    }
    return deleted;
  }

  private parseOrders(orders: Collection, idMaps: Record<string, IdMap>) {
    const parsedOrders: Order[] = [];
    for (const order of orders) {
      parsedOrders.push(this.parseOrder(order, idMaps));
    }
    return parsedOrders;
  }

  private parseOrder(
    order: Collection[number],
    {
      users: usersIdMap,
      deliveryMethods: deliveryMethodsIdMap,
      paymentMethods: paymentMethodsIdMap,
      products: productsIdMap,
    }: Record<string, IdMap>,
  ) {
    const parsedOrder = new OrderCreateDto() as any;
    try {
      parsedOrder.id = order.id as number;
      parsedOrder.created = new Date(order.created as string);
      parsedOrder.updated = new Date(order.updated as string);
      parsedOrder.status = order.status as OrderStatus;
      parsedOrder.fullName = order.fullName as string;
      parsedOrder.contactPhone = order.contactPhone as string;
      parsedOrder.contactEmail = order.contactEmail as string;
      parsedOrder.message = order.message as string;
      parsedOrder.user = { id: usersIdMap[order.userId as number] };
      if (typeof order.delivery === 'string') {
        order.delivery = JSON.parse(order.delivery);
      }
      parsedOrder.delivery = this.parseOrderDelivery(
        order.delivery as Record<string, any>,
        deliveryMethodsIdMap,
      );
      if (typeof order.payment === 'string') {
        order.payment = JSON.parse(order.payment);
      }
      parsedOrder.payment = this.parseOrderPayment(
        order.payment as Record<string, any>,
        paymentMethodsIdMap,
      );
      if (typeof order.items === 'string') {
        order.items = JSON.parse(order.items);
      }
      parsedOrder.items = (order.items as Collection).map((item) =>
        this.parseOrderItem(item, productsIdMap),
      );
    } catch (e) {
      throw new ParseError('order');
    }
    return parsedOrder;
  }

  private parseOrderDelivery(
    delivery: Collection[number],
    deliveryMethodsIdMap: IdMap,
  ) {
    const parsedDelivery = new OrderDeliveryDto();
    try {
      parsedDelivery.methodId =
        deliveryMethodsIdMap[delivery.methodId as number];
      parsedDelivery.deliveryStatus = delivery.deliveryStatus as string;
      parsedDelivery.address = delivery.address as string;
      parsedDelivery.city = delivery.city as string;
      parsedDelivery.postalCode = delivery.postalCode as string;
      parsedDelivery.country = delivery.country as string;
    } catch (e) {
      throw new ParseError('order delivery');
    }
    return parsedDelivery;
  }

  private parseOrderPayment(
    payment: Collection[number],
    paymentMethodsIdMap: IdMap,
  ) {
    const parsedPayment = new OrderPaymentDto();
    try {
      parsedPayment.methodId = paymentMethodsIdMap[payment.methodId as number];
      parsedPayment.paymentStatus = payment.paymentStatus as string;
    } catch (e) {
      throw new ParseError('order payment');
    }
    return parsedPayment;
  }

  private parseOrderItem(item: Collection[number], productsIdMap: IdMap) {
    const parsedItem = new OrderItemDto() as any;
    try {
      parsedItem.productId = productsIdMap[item.productId as number];
      parsedItem.quantity = item.quantity as number;
      parsedItem.price = item.price as number;
    } catch (e) {
      throw new ParseError('order item');
    }
    return parsedItem;
  }
}
