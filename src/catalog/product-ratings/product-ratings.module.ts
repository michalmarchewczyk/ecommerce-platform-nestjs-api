import { Module } from '@nestjs/common';
import { ProductRatingsController } from './product-ratings.controller';
import { ProductRatingsService } from './product-ratings.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductRating } from './models/product-rating.entity';
import { SettingsModule } from '../../settings/settings.module';
import { ProductRatingPhotosModule } from './product-rating-photos/product-rating-photos.module';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductRating]),
    ProductRatingPhotosModule,
    ProductsModule,
    SettingsModule,
  ],
  controllers: [ProductRatingsController],
  providers: [ProductRatingsService],
})
export class ProductRatingsModule {}
