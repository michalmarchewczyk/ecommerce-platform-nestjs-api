import { Module } from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { ReturnsController } from './returns.controller';
import { Return } from './models/return.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReturnsSubscriber } from './returns.subscriber';
import { OrdersModule } from '../orders/orders.module';
import { ReturnsExporter } from './returns.exporter';
import { ReturnsImporter } from './returns.importer';

@Module({
  imports: [TypeOrmModule.forFeature([Return]), OrdersModule],
  providers: [
    ReturnsService,
    ReturnsSubscriber,
    ReturnsExporter,
    ReturnsImporter,
  ],
  controllers: [ReturnsController],
  exports: [ReturnsExporter, ReturnsImporter],
})
export class ReturnsModule {}
