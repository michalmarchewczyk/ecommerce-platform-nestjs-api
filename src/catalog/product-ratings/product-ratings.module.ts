import { Module } from '@nestjs/common';
import { ProductRatingsController } from './product-ratings.controller';
import { ProductRatingsService } from './product-ratings.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductRating } from './models/product-rating.entity';
import { Product } from '../products/models/product.entity';
import { SettingsModule } from '../../settings/settings.module';
import { ProductRatingPhotosModule } from './product-rating-photos/product-rating-photos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductRating, Product]),
    ProductRatingPhotosModule,
    SettingsModule,
  ],
  controllers: [ProductRatingsController],
  providers: [ProductRatingsService],
  exports: [ProductRatingsService],
})
export class ProductRatingsModule {}
