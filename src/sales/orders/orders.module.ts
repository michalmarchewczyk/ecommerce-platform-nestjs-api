import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './models/order.entity';
import { UsersModule } from '../../users/users.module';
import { OrderItem } from './models/order-item.entity';
import { OrderDelivery } from './models/order-delivery.entity';
import { OrderPayment } from './models/order-payment.entity';
import { OrdersSubscriber } from './orders.subscriber';
import { CatalogModule } from '../../catalog/catalog.module';
import { DeliveryMethodsModule } from '../delivery-methods/delivery-methods.module';
import { PaymentMethodsModule } from '../payment-methods/payment-methods.module';
import { OrdersExporter } from './orders.exporter';
import { OrdersImporter } from './orders.importer';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, OrderDelivery, OrderPayment]),
    UsersModule,
    CatalogModule,
    DeliveryMethodsModule,
    PaymentMethodsModule,
  ],
  providers: [OrdersService, OrdersSubscriber, OrdersExporter, OrdersImporter],
  controllers: [OrdersController],
  exports: [OrdersService, OrdersExporter, OrdersImporter],
})
export class OrdersModule {}
