import { Module } from '@nestjs/common';
import { PaymentMethodsService } from './payment-methods.service';
import { PaymentMethodsController } from './payment-methods.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentMethod } from './models/payment-method.entity';
import { PaymentMethodsExporter } from './payment-methods.exporter';
import { PaymentMethodsImporter } from './payment-methods.importer';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentMethod])],
  providers: [
    PaymentMethodsService,
    PaymentMethodsExporter,
    PaymentMethodsImporter,
  ],
  controllers: [PaymentMethodsController],
  exports: [
    PaymentMethodsService,
    PaymentMethodsExporter,
    PaymentMethodsImporter,
  ],
})
export class PaymentMethodsModule {}
