import { Injectable } from '@nestjs/common';
import { Wishlist } from './models/wishlist.entity';
import { WishlistsService } from './wishlists.service';
import { Exporter } from '../import-export/models/exporter.interface';

@Injectable()
export class WishlistsExporter implements Exporter<Wishlist> {
  constructor(private wishlistsService: WishlistsService) {}

  async export(): Promise<Wishlist[]> {
    const wishlists = await this.wishlistsService.getWishlists();
    const preparedWishlists: Wishlist[] = [];
    for (const wishlist of wishlists) {
      preparedWishlists.push(this.prepareWishlist(wishlist));
    }
    return preparedWishlists;
  }

  private prepareWishlist(wishlist: Wishlist) {
    const preparedWishlist = new Wishlist() as any;
    preparedWishlist.id = wishlist.id;
    preparedWishlist.name = wishlist.name;
    preparedWishlist.userId = wishlist.user.id;
    preparedWishlist.products = wishlist.products.map(({ id }) => ({ id }));
    return preparedWishlist;
  }
}
