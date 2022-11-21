import { Injectable, StreamableFile } from '@nestjs/common';
import { NotFoundError } from '../../../errors/not-found.error';
import { ProductRating } from '../../entities/product-rating.entity';
import { ProductRatingPhoto } from '../../entities/product-rating-photo.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocalFilesService } from '../../../local-files/local-files.service';
import { SettingsService } from '../../../settings/settings.service';

@Injectable()
export class ProductRatingPhotosService {
  constructor(
    @InjectRepository(ProductRating)
    private readonly productRatingsRepository: Repository<ProductRating>,
    @InjectRepository(ProductRatingPhoto)
    private readonly productRatingPhotosRepository: Repository<ProductRatingPhoto>,
    private readonly localFilesService: LocalFilesService,
    private settingsService: SettingsService,
  ) {}

  async checkProductRatingUser(id: number, userId: number): Promise<boolean> {
    const productRating = await this.productRatingsRepository.findOne({
      where: { id, user: { id: userId } },
    });
    return !!productRating;
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
