import { Module } from '@nestjs/common';
import { WishlistsController } from './wishlists.controller';
import { WishlistsService } from './wishlists.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wishlist } from './models/wishlist.entity';
import { CatalogModule } from '../catalog/catalog.module';
import { WishlistsExporter } from './wishlists.exporter';
import { WishlistsImporter } from './wishlists.importer';

@Module({
  imports: [TypeOrmModule.forFeature([Wishlist]), CatalogModule],
  controllers: [WishlistsController],
  providers: [WishlistsService, WishlistsExporter, WishlistsImporter],
  exports: [WishlistsExporter, WishlistsImporter],
})
export class WishlistsModule {}
