import { Module } from '@nestjs/common';
import { ProductRatingPhotosService } from './product-rating-photos.service';
import { ProductRatingPhotosController } from './product-rating-photos.controller';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductRating } from '../../entities/product-rating.entity';
import { Product } from '../../entities/product.entity';
import { ProductRatingPhoto } from '../../entities/product-rating-photo.entity';
import { SettingsModule } from '../../../settings/settings.module';
import { LocalFilesModule } from '../../../local-files/local-files.module';

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
  providers: [ProductRatingPhotosService],
  controllers: [ProductRatingPhotosController],
})
export class ProductRatingPhotosModule {}
