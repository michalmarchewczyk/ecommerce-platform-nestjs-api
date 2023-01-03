import { Injectable } from '@nestjs/common';
import { WishlistsService } from './wishlists.service';
import { Wishlist } from './models/wishlist.entity';
import { Importer } from '../import-export/models/importer.interface';
import { Collection } from '../import-export/models/collection.type';
import { IdMap } from '../import-export/models/id-map.type';
import { ParseError } from '../errors/parse.error';
import { User } from '../users/models/user.entity';
import { Product } from '../catalog/products/models/product.entity';

@Injectable()
export class WishlistsImporter implements Importer {
  constructor(private wishlistsService: WishlistsService) {}

  async import(
    wishlists: Collection,
    idMaps: Record<string, IdMap>,
  ): Promise<IdMap> {
    const parsedWishlists = this.parseWishlists(
      wishlists,
      idMaps.users,
      idMaps.products,
    );
    const idMap: IdMap = {};
    for (const wishlist of parsedWishlists) {
      const { id, user, products, ...createDto } = wishlist;
      const { id: newId } = await this.wishlistsService.createWishlist(
        user,
        {
          ...createDto,
          productIds: products.map(({ id }) => id),
        },
        true,
      );
      idMap[wishlist.id] = newId;
    }
    return idMap;
  }

  async clear() {
    const wishlists = await this.wishlistsService.getWishlists();
    let deleted = 0;
    for (const wishlist of wishlists) {
      await this.wishlistsService.deleteWishlist(
        { id: wishlist.user.id } as User,
        wishlist.id,
      );
      deleted += 1;
    }
    return deleted;
  }

  private parseWishlists(
    wishlists: Collection,
    usersIdMap: IdMap,
    productsIdMap: IdMap,
  ) {
    const parsedWishlists: Wishlist[] = [];
    for (const wishlist of wishlists) {
      parsedWishlists.push(
        this.parseWishlist(wishlist, usersIdMap, productsIdMap),
      );
    }
    return parsedWishlists;
  }

  private parseWishlist(
    wishlist: Collection[number],
    usersIdMap: IdMap,
    productsIdMap: IdMap,
  ) {
    const parsedWishlist = new Wishlist();
    try {
      parsedWishlist.id = wishlist.id as number;
      parsedWishlist.name = wishlist.name as string;
      parsedWishlist.user = {
        id: usersIdMap[wishlist.userId as number],
      } as User;
      parsedWishlist.products = (wishlist.products as Collection).map(
        (product) => this.parseProduct(product, productsIdMap),
      );
    } catch (e) {
      throw new ParseError('wishlist');
    }
    return parsedWishlist;
  }

  private parseProduct(product: Collection[number], productsIdMap: IdMap) {
    try {
      return { id: productsIdMap[product.id as number] } as Product;
    } catch (e) {
      throw new ParseError('product');
    }
  }
}
