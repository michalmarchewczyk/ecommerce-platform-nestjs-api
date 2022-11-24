import { Module } from '@nestjs/common';
import { ProductRatingPhotosService } from './product-rating-photos.service';
import { ProductRatingPhotosController } from './product-rating-photos.controller';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductRating } from '../models/product-rating.entity';
import { ProductRatingPhoto } from './models/product-rating-photo.entity';
import { LocalFilesModule } from '../../../local-files/local-files.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductRating, ProductRatingPhoto]),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        dest: configService.get<string>('uploadPath'),
      }),
      inject: [ConfigService],
    }),
    LocalFilesModule,
  ],
  providers: [ProductRatingPhotosService],
  controllers: [ProductRatingPhotosController],
})
export class ProductRatingPhotosModule {}
