import {
  AfterUpdate,
  BeforeInsert,
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import { Order } from './models/order.entity';
import { ProductsService } from '../../catalog/products/products.service';
import { OrderItem } from './models/order-item.entity';
import { OrderStatus } from './models/order-status.enum';

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
    if (!(await this.productsService.checkProductsStocks(event.entity.items))) {
      event.entity.status = OrderStatus.Failed;
      return;
    }
    await this.productsService.updateProductsStocks(
      'subtract',
      event.entity.items,
    );
  }

  @AfterUpdate()
  async afterUpdate(event: UpdateEvent<Order>) {
    if (!event.entity) {
      return;
    }
    if (
      event.databaseEntity.items.map((i) => i.id).join(',') !==
      event.entity.items.map((i: OrderItem) => i.id).join(',')
    ) {
      if (
        !(await this.productsService.checkProductsStocks(event.entity.items))
      ) {
        event.entity.status = OrderStatus.Failed;
        return;
      }
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
      if (
        !(await this.productsService.checkProductsStocks(event.entity.items))
      ) {
        event.entity.status = OrderStatus.Failed;
        return;
      }
      await this.productsService.updateProductsStocks(
        'subtract',
        event.entity.items,
      );
    }
  }
}
