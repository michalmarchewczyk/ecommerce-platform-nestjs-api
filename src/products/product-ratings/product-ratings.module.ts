import { Module } from '@nestjs/common';
import { ProductRatingsController } from './product-ratings.controller';
import { ProductRatingsService } from './product-ratings.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductRating } from '../entities/product-rating.entity';
import { Product } from '../entities/product.entity';
import { ProductRatingPhoto } from '../entities/product-rating-photo.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductRating, Product, ProductRatingPhoto]),
  ],
  controllers: [ProductRatingsController],
  providers: [ProductRatingsService],
})
export class ProductRatingsModule {}
