import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../entities/order.entity';
import { UsersModule } from '../../users/users.module';
import { OrderItem } from '../entities/order-item.entity';
import { OrderDelivery } from '../entities/order-delivery.entity';
import { OrderPayment } from '../entities/order-payment.entity';
import { OrdersSubscriber } from './orders.subscriber';
import { CatalogModule } from '../../catalog/catalog.module';
import { DeliveryMethodsModule } from '../delivery-methods/delivery-methods.module';
import { PaymentMethodsModule } from '../payment-methods/payment-methods.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, OrderDelivery, OrderPayment]),
    UsersModule,
    CatalogModule,
    DeliveryMethodsModule,
    PaymentMethodsModule,
  ],
  providers: [OrdersService, OrdersSubscriber],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
