import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wishlist } from './models/wishlist.entity';
import { User } from '../users/models/user.entity';
import { WishlistCreateDto } from './dto/wishlist-create.dto';
import { WishlistUpdateDto } from './dto/wishlist-update.dto';
import { NotFoundError } from '../errors/not-found.error';
import { ProductsService } from '../catalog/products/products.service';
import { Role } from '../users/models/role.enum';

@Injectable()
export class WishlistsService {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistsRepository: Repository<Wishlist>,
    private productsService: ProductsService,
  ) {}

  async getWishlists(): Promise<Wishlist[]> {
    return await this.wishlistsRepository.find({
      relations: ['user', 'products'],
    });
  }

  async getUserWishlists(user: User): Promise<Wishlist[]> {
    return this.wishlistsRepository.find({ where: { user: { id: user.id } } });
  }

  async getWishlist(userId: number, id: number): Promise<Wishlist> {
    const wishlist = await this.wishlistsRepository.findOne({
      where: {
        id,
        user: { id: userId },
      },
    });
    if (!wishlist) {
      throw new NotFoundError('wishlist');
    }
    return wishlist;
  }

  async createWishlist(
    user: User,
    createData: WishlistCreateDto,
    withHidden?: boolean,
  ): Promise<Wishlist> {
    const wishlist = new Wishlist();
    wishlist.user = user;
    wishlist.name = createData.name;
    wishlist.products = [];
    for (const productId of createData.productIds) {
      const product = await this.productsService.getProduct(
        productId,
        [Role.Admin, Role.Manager, Role.Sales].includes(user.role) ||
          withHidden,
      );
      wishlist.products.push(product);
    }
    return this.wishlistsRepository.save(wishlist);
  }

  async updateWishlist(
    user: User,
    id: number,
    updateData: WishlistUpdateDto,
  ): Promise<Wishlist> {
    const wishlist = await this.getWishlist(user.id, id);
    wishlist.name = updateData.name ?? wishlist.name;
    wishlist.products = [];
    for (const productId of updateData.productIds ?? []) {
      const product = await this.productsService.getProduct(
        productId,
        [Role.Admin, Role.Manager, Role.Sales].includes(user.role),
      );
      wishlist.products.push(product);
    }
    return this.wishlistsRepository.save(wishlist);
  }

  async deleteWishlist(user: User, id: number): Promise<boolean> {
    await this.getWishlist(user.id, id);
    await this.wishlistsRepository.delete({ id });
    return true;
  }
}
