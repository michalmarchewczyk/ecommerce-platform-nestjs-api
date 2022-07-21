import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { UsersModule } from '../users/users.module';
import { ProductsModule } from '../products/products.module';
import { OrderItem } from './entities/order-item.entity';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { OrderDelivery } from './entities/order-delivery.entity';
import { PaymentsModule } from './payments/payments.module';
import { OrderPayment } from './entities/order-payment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, OrderDelivery, OrderPayment]),
    UsersModule,
    ProductsModule,
    DeliveriesModule,
    PaymentsModule,
  ],
  providers: [OrdersService],
  controllers: [OrdersController],
})
export class OrdersModule {}
