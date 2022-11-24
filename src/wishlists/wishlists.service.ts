import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wishlist } from './models/wishlist.entity';
import { User } from '../users/models/user.entity';
import { WishlistCreateDto } from './dto/wishlist-create.dto';
import { WishlistUpdateDto } from './dto/wishlist-update.dto';
import { NotFoundError } from '../errors/not-found.error';
import { Product } from '../catalog/products/models/product.entity';

@Injectable()
export class WishlistsService {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistsRepository: Repository<Wishlist>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async getUserWishlists(user: User): Promise<Wishlist[]> {
    return this.wishlistsRepository.find({ where: { user: { id: user.id } } });
  }

  async createWishlist(
    user: User,
    createData: WishlistCreateDto,
  ): Promise<Wishlist> {
    const wishlist = new Wishlist();
    wishlist.user = user;
    wishlist.name = createData.name;
    wishlist.products = [];
    for (const productId of createData.productIds) {
      const product = await this.productsRepository.findOne({
        where: { id: productId },
      });
      if (!product) {
        throw new NotFoundError('product');
      }
      wishlist.products.push(product);
    }
    return this.wishlistsRepository.save(wishlist);
  }

  async updateWishlist(
    user: User,
    id: number,
    updateData: WishlistUpdateDto,
  ): Promise<Wishlist> {
    const wishlist = await this.wishlistsRepository.findOne({
      where: {
        id,
        user: { id: user.id },
      },
    });
    if (!wishlist) {
      throw new NotFoundError('wishlist');
    }
    wishlist.name = updateData.name ?? wishlist.name;
    wishlist.products = [];
    for (const productId of updateData.productIds ?? []) {
      const product = await this.productsRepository.findOne({
        where: { id: productId },
      });
      if (!product) {
        throw new NotFoundError('product');
      }
      wishlist.products.push(product);
    }
    return this.wishlistsRepository.save(wishlist);
  }

  async deleteWishlist(user: User, id: number): Promise<boolean> {
    const wishlist = await this.wishlistsRepository.findOne({
      where: {
        id,
        user: { id: user.id },
      },
    });
    if (!wishlist) {
      throw new NotFoundError('wishlist');
    }
    await this.wishlistsRepository.delete({ id });
    return true;
  }
}
