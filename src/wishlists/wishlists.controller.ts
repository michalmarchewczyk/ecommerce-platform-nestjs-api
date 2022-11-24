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
import { ReqUser } from '../auth/decorators/user.decorator';
import { User } from '../users/models/user.entity';
import { Wishlist } from './models/wishlist.entity';
import { Role } from '../users/models/role.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { WishlistCreateDto } from './dto/wishlist-create.dto';
import { WishlistUpdateDto } from './dto/wishlist-update.dto';
import {
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('wishlists')
@Controller('wishlists')
export class WishlistsController {
  constructor(private readonly wishlistsService: WishlistsService) {}

  @Get()
  @Roles(Role.Admin, Role.Manager, Role.Sales, Role.Customer)
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiOkResponse({ type: [Wishlist], description: 'User wishlists' })
  async getUserWishlists(@ReqUser() user: User): Promise<Wishlist[]> {
    return this.wishlistsService.getUserWishlists(user);
  }

  @Post()
  @Roles(Role.Admin, Role.Manager, Role.Sales, Role.Customer)
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiCreatedResponse({ type: Wishlist, description: 'Wishlist created' })
  async createWishlist(
    @ReqUser() user: User,
    @Body() body: WishlistCreateDto,
  ): Promise<Wishlist> {
    return this.wishlistsService.createWishlist(user, body);
  }

  @Patch('/:id')
  @Roles(Role.Admin, Role.Manager, Role.Sales, Role.Customer)
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiNotFoundResponse({ description: 'Wishlist not found' })
  @ApiOkResponse({ type: Wishlist, description: 'Wishlist updated' })
  async updateWishlist(
    @ReqUser() user: User,
    @Param('id') id: number,
    @Body() body: WishlistUpdateDto,
  ): Promise<Wishlist> {
    return this.wishlistsService.updateWishlist(user, id, body);
  }

  @Delete('/:id')
  @Roles(Role.Admin, Role.Manager, Role.Sales, Role.Customer)
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiNotFoundResponse({ description: 'Wishlist not found' })
  @ApiOkResponse({ description: 'Wishlist deleted' })
  async deleteWishlist(
    @ReqUser() user: User,
    @Param('id') id: number,
  ): Promise<void> {
    await this.wishlistsService.deleteWishlist(user, id);
  }
}
