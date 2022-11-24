import { Module } from '@nestjs/common';
import { DeliveryMethodsController } from './delivery-methods.controller';
import { DeliveryMethodsService } from './delivery-methods.service';
import { DeliveryMethod } from './models/delivery-method.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([DeliveryMethod])],
  controllers: [DeliveryMethodsController],
  providers: [DeliveryMethodsService],
  exports: [DeliveryMethodsService],
})
export class DeliveryMethodsModule {}
