import { Module } from '@nestjs/common';
import { ProductRatingsController } from './product-ratings.controller';
import { ProductRatingsService } from './product-ratings.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductRating } from '../entities/product-rating.entity';
import { Product } from '../entities/product.entity';
import { ProductRatingPhoto } from '../entities/product-rating-photo.entity';
import { LocalFilesModule } from '../../local-files/local-files.module';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SettingsModule } from '../../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductRating, Product, ProductRatingPhoto]),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        dest: configService.get<string>('uploadPath'),
      }),
      inject: [ConfigService],
    }),
    SettingsModule,
    LocalFilesModule,
  ],
  controllers: [ProductRatingsController],
  providers: [ProductRatingsService],
})
export class ProductRatingsModule {}
