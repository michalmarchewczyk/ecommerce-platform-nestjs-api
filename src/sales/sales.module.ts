import { Module } from '@nestjs/common';
import { DeliveryMethodsModule } from './delivery-methods/delivery-methods.module';
import { PaymentMethodsModule } from './payment-methods/payment-methods.module';
import { OrdersModule } from './orders/orders.module';
import { ReturnsModule } from './returns/returns.module';

@Module({
  imports: [
    DeliveryMethodsModule,
    PaymentMethodsModule,
    OrdersModule,
    ReturnsModule,
  ],
  exports: [
    DeliveryMethodsModule,
    PaymentMethodsModule,
    OrdersModule,
    ReturnsModule,
  ],
})
export class SalesModule {}
