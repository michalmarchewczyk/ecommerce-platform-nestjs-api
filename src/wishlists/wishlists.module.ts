import { Module } from '@nestjs/common';
import { WishlistsController } from './wishlists.controller';
import { WishlistsService } from './wishlists.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wishlist } from './models/wishlist.entity';
import { CatalogModule } from '../catalog/catalog.module';

@Module({
  imports: [TypeOrmModule.forFeature([Wishlist]), CatalogModule],
  controllers: [WishlistsController],
  providers: [WishlistsService],
})
export class WishlistsModule {}
