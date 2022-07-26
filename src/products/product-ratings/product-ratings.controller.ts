import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ProductRatingsService } from './product-ratings.service';
import { ProductRatingDto } from '../dto/product-rating.dto';
import { ProductRating } from '../entities/product-rating.entity';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '../../users/entities/role.enum';
import { ReqUser } from '../../auth/user.decorator';
import { User } from '../../users/entities/user.entity';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('product ratings')
@Controller('product-ratings')
export class ProductRatingsController {
  constructor(private readonly productRatingsService: ProductRatingsService) {}

  @Get(':productId')
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiOkResponse({
    type: [ProductRating],
    description: 'List or ratings for given product',
  })
  async getProductRatings(
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<ProductRating[]> {
    return await this.productRatingsService.getProductRatings(productId);
  }

  @Post(':productId')
  @Roles(Role.Admin, Role.Manager, Role.Sales, Role.Customer)
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiCreatedResponse({ description: 'Product rating created' })
  @ApiBadRequestResponse({ description: 'Invalid rating data' })
  async createProductRating(
    @ReqUser() user: User,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() body: ProductRatingDto,
  ): Promise<ProductRating> {
    return await this.productRatingsService.createProductRating(
      user,
      productId,
      body,
    );
  }

  @Put(':productId/:id')
  @Roles(Role.Admin, Role.Manager, Role.Sales, Role.Customer)
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiNotFoundResponse({ description: 'Product rating not found' })
  @ApiOkResponse({ description: 'Product rating updated' })
  @ApiBadRequestResponse({ description: 'Invalid rating data' })
  async updateProductRating(
    @ReqUser() user: User,
    @Param('productId', ParseIntPipe) productId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ProductRatingDto,
  ): Promise<ProductRating> {
    const checkUser = await this.productRatingsService.checkProductRatingUser(
      id,
      user.id,
    );
    if (!checkUser && user.role === Role.Customer) {
      throw new ForbiddenException(['forbidden']);
    }
    return await this.productRatingsService.updateProductRating(
      productId,
      id,
      body,
    );
  }

  @Delete(':productId/:id')
  @Roles(Role.Admin, Role.Manager, Role.Sales, Role.Customer)
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiNotFoundResponse({ description: 'Product rating not found' })
  @ApiOkResponse({ description: 'Product rating deleted' })
  async deleteProductRating(
    @ReqUser() user: User,
    @Param('productId', ParseIntPipe) productId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    const checkUser = await this.productRatingsService.checkProductRatingUser(
      id,
      user.id,
    );
    if (!checkUser && user.role === Role.Customer) {
      throw new ForbiddenException(['forbidden']);
    }
    await this.productRatingsService.deleteProductRating(productId, id);
  }
}
