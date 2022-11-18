import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { UsersModule } from '../users/users.module';
import { ProductsModule } from '../products/products.module';
import { OrderItem } from './entities/order-item.entity';
import { DeliveryMethodsModule } from './delivery-methods/delivery-methods.module';
import { OrderDelivery } from './entities/order-delivery.entity';
import { PaymentMethodsModule } from './payment-methods/payment-methods.module';
import { OrderPayment } from './entities/order-payment.entity';
import { OrdersSubscriber } from './orders.subscriber';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, OrderDelivery, OrderPayment]),
    UsersModule,
    ProductsModule,
    DeliveryMethodsModule,
    PaymentMethodsModule,
  ],
  providers: [OrdersService, OrdersSubscriber],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
