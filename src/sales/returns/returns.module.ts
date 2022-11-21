import { Module } from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { ReturnsController } from './returns.controller';
import { Return } from './entities/return.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../entities/order.entity';
import { ReturnsSubscriber } from './returns.subscriber';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [TypeOrmModule.forFeature([Return, Order]), OrdersModule],
  providers: [ReturnsService, ReturnsSubscriber],
  controllers: [ReturnsController],
})
export class ReturnsModule {}
