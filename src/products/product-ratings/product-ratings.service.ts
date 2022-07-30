import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ProductRating } from '../entities/product-rating.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductRatingDto } from '../dto/product-rating.dto';
import { Product } from '../entities/product.entity';
import { NotFoundError } from '../../errors/not-found.error';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class ProductRatingsService {
  constructor(
    @InjectRepository(ProductRating)
    private readonly productRatingsRepository: Repository<ProductRating>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async getProductRatings(productId: number): Promise<ProductRating[]> {
    return this.productRatingsRepository.find({
      where: { product: { id: productId } },
    });
  }

  async createProductRating(
    user: User,
    productId: number,
    createData: ProductRatingDto,
  ): Promise<ProductRating> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundError('product', 'id', productId.toString());
    }
    const newProductRating = new ProductRating();
    newProductRating.user = user;
    newProductRating.product = product;
    newProductRating.rating = createData.rating;
    newProductRating.comment = createData.comment;
    return this.productRatingsRepository.save(newProductRating);
  }

  async checkProductRatingUser(id: number, userId: number): Promise<boolean> {
    const productRating = await this.productRatingsRepository.findOne({
      where: { id, user: { id: userId } },
    });
    return !!productRating;
  }

  async updateProductRating(
    productId: number,
    id: number,
    updateData: ProductRatingDto,
  ): Promise<ProductRating> {
    const productRating = await this.productRatingsRepository.findOne({
      where: { id, product: { id: productId } },
    });
    if (!productRating) {
      throw new NotFoundError('product rating');
    }
    productRating.rating = updateData.rating;
    productRating.comment = updateData.comment;
    return this.productRatingsRepository.save(productRating);
  }

  async deleteProductRating(productId: number, id: number): Promise<boolean> {
    const productRating = await this.productRatingsRepository.findOne({
      where: { id, product: { id: productId } },
    });
    if (!productRating) {
      throw new NotFoundError('product rating');
    }
    await this.productRatingsRepository.delete({
      id,
      product: { id: productId },
    });
    return true;
  }
}