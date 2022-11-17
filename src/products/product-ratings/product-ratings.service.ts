import { Injectable, StreamableFile } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ProductRating } from '../entities/product-rating.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductRatingDto } from '../dto/product-rating.dto';
import { Product } from '../entities/product.entity';
import { NotFoundError } from '../../errors/not-found.error';
import { User } from '../../users/entities/user.entity';
import { LocalFilesService } from '../../local-files/local-files.service';
import { ProductRatingPhoto } from '../entities/product-rating-photo.entity';
import { SettingsService } from '../../settings/settings.service';

@Injectable()
export class ProductRatingsService {
  constructor(
    @InjectRepository(ProductRating)
    private readonly productRatingsRepository: Repository<ProductRating>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductRatingPhoto)
    private readonly productRatingPhotosRepository: Repository<ProductRatingPhoto>,
    private readonly localFilesService: LocalFilesService,
    private settingsService: SettingsService,
  ) {}

  async getProductRatings(productId: number): Promise<ProductRating[]> {
    const rating = await this.productRatingsRepository.find({
      where: { product: { id: productId } },
    });
    if (
      (await this.settingsService.getSettingValueByName(
        'Product rating photos',
      )) !== 'true'
    ) {
      rating.forEach((r) => (r.photos = []));
    }
    return rating;
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

  async getProductRatingPhoto(
    productId: number,
    productRatingId: number,
    photoId: number,
    thumbnail: boolean,
  ): Promise<StreamableFile> {
    if (
      (await this.settingsService.getSettingValueByName(
        'Product rating photos',
      )) !== 'true'
    ) {
      throw new NotFoundError('product rating photo');
    }

    const ratingPhoto = await this.productRatingPhotosRepository.findOne({
      where: {
        id: photoId,
        productRating: { id: productRatingId, product: { id: productId } },
      },
    });
    if (!ratingPhoto) {
      throw new NotFoundError('product rating photo', 'id', photoId.toString());
    }

    const photoPath = thumbnail ? ratingPhoto.thumbnailPath : ratingPhoto.path;

    const mimeType = thumbnail ? 'image/jpeg' : ratingPhoto.mimeType;

    return await this.localFilesService.getPhoto(photoPath, mimeType);
  }

  async addProductRatingPhoto(
    productId: number,
    productRatingId: number,
    file: Express.Multer.File,
  ): Promise<ProductRating> {
    if (
      (await this.settingsService.getSettingValueByName(
        'Product rating photos',
      )) !== 'true'
    ) {
      throw new NotFoundError('product rating');
    }
    const productRating = await this.productRatingsRepository.findOne({
      where: { id: productRatingId, product: { id: productId } },
    });
    if (!productRating) {
      throw new NotFoundError(
        'product rating',
        'id',
        productRatingId.toString(),
      );
    }
    const photo = new ProductRatingPhoto();
    const { path, mimeType } = await this.localFilesService.savePhoto(file);
    photo.path = path;
    photo.mimeType = mimeType;
    photo.thumbnailPath = await this.localFilesService.createPhotoThumbnail(
      file.path,
    );
    productRating.photos.push(photo);
    return this.productRatingsRepository.save(productRating);
  }

  async deleteProductRatingPhoto(
    productId: number,
    productRatingId: number,
    photoId: number,
  ): Promise<ProductRating> {
    if (
      (await this.settingsService.getSettingValueByName(
        'Product rating photos',
      )) !== 'true'
    ) {
      throw new NotFoundError('product rating photo');
    }
    const productRating = await this.productRatingsRepository.findOne({
      where: { id: productRatingId, product: { id: productId } },
    });
    if (!productRating) {
      throw new NotFoundError(
        'product rating',
        'id',
        productRatingId.toString(),
      );
    }
    productRating.photos = productRating.photos.filter((p) => p.id !== photoId);
    return await this.productRatingsRepository.save(productRating);
  }
}
