import {
  AfterUpdate,
  BeforeInsert,
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import { Order } from './entities/order.entity';
import { ProductsService } from '../products/products.service';
import { OrderItem } from './entities/order-item.entity';

@EventSubscriber()
export class OrdersSubscriber implements EntitySubscriberInterface<Order> {
  constructor(
    dataSource: DataSource,
    private productsService: ProductsService,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Order;
  }

  @BeforeInsert()
  async beforeInsert(event: InsertEvent<Order>) {
    // TODO: mark order as failed if stock is too low
    await this.productsService.updateProductsStocks(
      'subtract',
      event.entity.items,
    );
  }

  @AfterUpdate()
  async afterUpdate(event: UpdateEvent<Order>) {
    // TODO: mark order as failed if stock is too low
    if (!event.entity) {
      return;
    }
    if (
      event.databaseEntity.items.map((i) => i.id).join(',') !==
      event.entity.items.map((i: OrderItem) => i.id).join(',')
    ) {
      await this.productsService.updateProductsStocks(
        'subtract',
        event.entity.items,
      );
    }
    if (
      ['pending', 'confirmed', 'open', 'delivered'].includes(
        event.databaseEntity.status,
      ) &&
      ['failed', 'cancelled', 'refunded'].includes(event.entity.status)
    ) {
      await this.productsService.updateProductsStocks(
        'add',
        event.entity.items,
      );
    }
    if (
      ['failed', 'cancelled', 'refunded'].includes(
        event.databaseEntity.status,
      ) &&
      ['pending', 'confirmed', 'open', 'delivered'].includes(
        event.entity.status,
      )
    ) {
      await this.productsService.updateProductsStocks(
        'subtract',
        event.entity.items,
      );
    }
  }
}
