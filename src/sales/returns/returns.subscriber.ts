import {
  BeforeInsert,
  BeforeUpdate,
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import { Return } from './models/return.entity';
import { OrdersService } from '../orders/orders.service';
import { OrderStatus } from '../orders/models/order-status.enum';

@EventSubscriber()
export class ReturnsSubscriber implements EntitySubscriberInterface<Return> {
  constructor(dataSource: DataSource, private ordersService: OrdersService) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Return;
  }

  @BeforeInsert()
  async beforeInsert(event: InsertEvent<Return>) {
    await this.ordersService.updateOrder(event.entity.order.id, {
      status: OrderStatus.Refunded,
    });
  }

  @BeforeUpdate()
  async beforeUpdate(event: UpdateEvent<Return>) {
    if (!event.entity) {
      return;
    }
    if (['rejected', 'cancelled'].includes(event.entity.status)) {
      await this.ordersService.updateOrder(event.databaseEntity.order.id, {
        status: OrderStatus.Delivered,
      });
    }
    if (['open', 'accepted', 'completed'].includes(event.entity.status)) {
      await this.ordersService.updateOrder(event.databaseEntity.order.id, {
        status: OrderStatus.Refunded,
      });
    }
  }
}
