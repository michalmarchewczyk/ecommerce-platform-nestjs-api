import { Module } from '@nestjs/common';
import { DeliveryMethodsController } from './delivery-methods.controller';
import { DeliveryMethodsService } from './delivery-methods.service';
import { DeliveryMethod } from './models/delivery-method.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryMethodsExporter } from './delivery-methods.exporter';
import { DeliveryMethodsImporter } from './delivery-methods.importer';

@Module({
  imports: [TypeOrmModule.forFeature([DeliveryMethod])],
  controllers: [DeliveryMethodsController],
  providers: [
    DeliveryMethodsService,
    DeliveryMethodsExporter,
    DeliveryMethodsImporter,
  ],
  exports: [
    DeliveryMethodsService,
    DeliveryMethodsExporter,
    DeliveryMethodsImporter,
  ],
})
export class DeliveryMethodsModule {}
