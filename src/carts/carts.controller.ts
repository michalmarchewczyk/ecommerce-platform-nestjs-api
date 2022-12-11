import { Body, Controller, Get, Put, Session } from '@nestjs/common';
import { CartsService } from './carts.service';
import { User } from '../users/models/user.entity';
import { ReqUser } from '../auth/decorators/user.decorator';
import { CartDto } from './dto/cart.dto';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Cart } from './models/cart.entity';

@ApiTags('carts')
@Controller('carts')
export class CartsController {
  constructor(private cartsService: CartsService) {}

  @Get('my')
  @ApiOkResponse({ type: Cart, description: 'Current user/session cart' })
  async getCart(
    @ReqUser() user: User | null,
    @Session() session: Record<string, any>,
  ) {
    session.cart = true;
    return await this.cartsService.getCart(user, session.id);
  }

  @Put('my')
  @ApiOkResponse({ type: Cart, description: 'Updated cart' })
  async updateCart(
    @ReqUser() user: User | null,
    @Session() session: Record<string, any>,
    @Body() body: CartDto,
  ) {
    session.cart = true;
    return await this.cartsService.updateCart(body, user, session.id);
  }
}
