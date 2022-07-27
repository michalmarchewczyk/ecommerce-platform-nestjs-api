import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { WishlistsService } from './wishlists.service';
import { ReqUser } from '../auth/user.decorator';
import { User } from '../users/entities/user.entity';
import { Wishlist } from './entities/wishlist.entity';
import { Role } from '../users/entities/role.enum';
import { Roles } from '../auth/roles.decorator';
import { WishlistCreateDto } from './dto/wishlist-create.dto';
import { WishlistUpdateDto } from './dto/wishlist-update.dto';

@Controller('wishlists')
export class WishlistsController {
  constructor(private readonly wishlistsService: WishlistsService) {}

  @Get()
  @Roles(Role.Admin, Role.Manager, Role.Sales, Role.Customer)
  async getUserWishlists(@ReqUser() user: User): Promise<Wishlist[]> {
    return this.wishlistsService.getUserWishlists(user);
  }

  @Post()
  @Roles(Role.Admin, Role.Manager, Role.Sales, Role.Customer)
  async createWishlist(
    @ReqUser() user: User,
    @Body() body: WishlistCreateDto,
  ): Promise<Wishlist> {
    return this.wishlistsService.createWishlist(user, body);
  }

  @Patch('/:id')
  @Roles(Role.Admin, Role.Manager, Role.Sales, Role.Customer)
  async updateWishlist(
    @ReqUser() user: User,
    @Param('id') id: number,
    @Body() body: WishlistUpdateDto,
  ): Promise<Wishlist> {
    return this.wishlistsService.updateWishlist(user, id, body);
  }

  @Delete('/:id')
  @Roles(Role.Admin, Role.Manager, Role.Sales, Role.Customer)
  async deleteWishlist(
    @ReqUser() user: User,
    @Param('id') id: number,
  ): Promise<void> {
    await this.wishlistsService.deleteWishlist(user, id);
  }
}
