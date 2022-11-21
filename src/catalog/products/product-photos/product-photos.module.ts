import { Module } from '@nestjs/common';
import { ProductPhotosService } from './product-photos.service';
import { ProductPhotosController } from './product-photos.controller';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalFilesModule } from '../../../local-files/local-files.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../../entities/product.entity';
import { ProductPhoto } from '../../entities/product-photo.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductPhoto]),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        dest: configService.get<string>('uploadPath'),
      }),
      inject: [ConfigService],
    }),
    LocalFilesModule,
  ],
  providers: [ProductPhotosService],
  controllers: [ProductPhotosController],
})
export class ProductPhotosModule {}
