import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cart } from './models/cart.entity';
import { Repository } from 'typeorm';
import { ProductsService } from '../catalog/products/products.service';
import { User } from '../users/models/user.entity';
import { CartDto } from './dto/cart.dto';
import { CartItem } from './models/cart-item.entity';

@Injectable()
export class CartsService {
  constructor(
    @InjectRepository(Cart) private cartsRepository: Repository<Cart>,
    private productsService: ProductsService,
  ) {}

  async getCart(user: User | null, sessionId?: string) {
    let cart: Cart | null = null;
    if (user?.id) {
      cart = await this.cartsRepository.findOne({
        where: { user: { id: user.id } },
      });
    } else if (sessionId) {
      cart = await this.cartsRepository.findOne({
        where: { sessionId },
      });
    }
    if (!cart) {
      cart = await this.createCart(user, sessionId);
    }
    return cart;
  }

  private async createCart(user: User | null, sessionId?: string) {
    if (user) {
      const cart = new Cart();
      cart.user = user;
      cart.items = [];
      return await this.cartsRepository.save(cart);
    } else {
      const cart = new Cart();
      cart.sessionId = sessionId;
      cart.items = [];
      return await this.cartsRepository.save(cart);
    }
  }

  async updateCart(updateData: CartDto, user: User | null, sessionId?: string) {
    const cart = await this.getCart(user, sessionId);
    cart.items = [];
    for (const { productId, quantity } of updateData.items) {
      const product = await this.productsService.getProduct(productId);
      const item = new CartItem();
      item.product = product;
      item.quantity = quantity;
      cart.items.push(item);
    }
    return await this.cartsRepository.save(cart);
  }
}
