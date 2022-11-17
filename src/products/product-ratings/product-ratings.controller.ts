import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  ForbiddenException,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseBoolPipe,
  ParseFilePipe,
  ParseIntPipe,
  Post,
  Put,
  Query,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
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
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiProduces,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Product } from '../entities/product.entity';
import { FileInterceptor } from '@nestjs/platform-express';

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
  @ApiCreatedResponse({
    type: ProductRating,
    description: 'Product rating created',
  })
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
  @ApiOkResponse({ type: ProductRating, description: 'Product rating updated' })
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

  @Get(':productId/:id/photos/:photoId')
  @ApiOkResponse({
    schema: {
      type: 'string',
      format: 'binary',
    },
    description: 'Product rating photo with given id',
  })
  @ApiProduces('image/*')
  @ApiNotFoundResponse({ description: 'Product rating photo not found' })
  async getProductRatingPhoto(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('id', ParseIntPipe) id: number,
    @Param('photoId', ParseIntPipe) photoId: number,
    @Query('thumbnail', ParseBoolPipe) thumbnail?: boolean,
  ): Promise<StreamableFile> {
    return await this.productRatingsService.getProductRatingPhoto(
      productId,
      id,
      photoId,
      thumbnail ?? false,
    );
  }

  @Post(':productId/:id/photos')
  @Roles(Role.Admin, Role.Manager, Role.Sales, Role.Customer)
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiNotFoundResponse({ description: 'Product rating not found' })
  @ApiCreatedResponse({
    type: Product,
    description: 'Product rating photo added',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async addProductRatingPhoto(
    @ReqUser() user: User,
    @Param('productId', ParseIntPipe) productId: number,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 }),
          new FileTypeValidator({ fileType: /^image\/(png|jpe?g|gif|webp)/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<ProductRating> {
    const checkUser = await this.productRatingsService.checkProductRatingUser(
      id,
      user.id,
    );
    if (!checkUser && user.role === Role.Customer) {
      throw new ForbiddenException(['forbidden']);
    }
    return await this.productRatingsService.addProductRatingPhoto(
      productId,
      id,
      file,
    );
  }

  @Delete(':productId/:id/photos/:photoId')
  @Roles(Role.Admin, Role.Manager, Role.Sales, Role.Customer)
  @ApiUnauthorizedResponse({ description: 'User not logged in' })
  @ApiForbiddenResponse({ description: 'User not authorized' })
  @ApiNotFoundResponse({ description: 'Product rating not found' })
  @ApiOkResponse({ type: Product, description: 'Product rating photo deleted' })
  async deleteProductRatingPhoto(
    @ReqUser() user: User,
    @Param('productId', ParseIntPipe) productId: number,
    @Param('id', ParseIntPipe) id: number,
    @Param('photoId', ParseIntPipe) photoId: number,
  ): Promise<ProductRating> {
    const checkUser = await this.productRatingsService.checkProductRatingUser(
      id,
      user.id,
    );
    if (!checkUser && user.role === Role.Customer) {
      throw new ForbiddenException(['forbidden']);
    }
    return await this.productRatingsService.deleteProductRatingPhoto(
      productId,
      id,
      photoId,
    );
  }
}
