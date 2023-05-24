import { Test, TestingModule } from '@nestjs/testing';
import { ProductRatingPhotosService } from './product-rating-photos.service';
import { DtoGeneratorService } from '../../../../test/utils/dto-generator/dto-generator.service';
import { RepositoryMockService } from '../../../../test/utils/repository-mock/repository-mock.service';
import { ProductRating } from '../models/product-rating.entity';
import { Product } from '../../products/models/product.entity';
import { ProductRatingPhoto } from './models/product-rating-photo.entity';
import { LocalFilesService } from '../../../local-files/local-files.service';
import { SettingsService } from '../../../settings/settings.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductCreateDto } from '../../products/dto/product-create.dto';
import { ProductRatingDto } from '../dto/product-rating.dto';
import { generateFileMetadata } from '../../../../test/utils/generate-file-metadata';
import { NotFoundError } from '../../../errors/not-found.error';

describe('ProductRatingPhotosService', () => {
  let service: ProductRatingPhotosService;
  let generate: DtoGeneratorService['generate'];
  let mockProductRatingsRepository: RepositoryMockService<ProductRating>;
  let mockProductsRepository: RepositoryMockService<Product>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductRatingPhotosService,
        RepositoryMockService.getProvider(ProductRating),
        RepositoryMockService.getProvider(Product),
        RepositoryMockService.getProvider(ProductRatingPhoto),
        DtoGeneratorService,
        {
          provide: LocalFilesService,
          useValue: {
            savePhoto: jest.fn((v) => ({
              path: v.path,
              mimeType: v.mimetype,
            })),
            createPhotoThumbnail: jest.fn((v: string) => v + '-thumbnail'),
            createPhotoPlaceholder: jest.fn(() => 'placeholder'),
          },
        },
        {
          provide: SettingsService,
          useValue: {
            getSettingValueByName: jest.fn(() => 'true'),
          },
        },
      ],
    }).compile();

    service = module.get<ProductRatingPhotosService>(
      ProductRatingPhotosService,
    );
    generate = module
      .get<DtoGeneratorService>(DtoGeneratorService)
      .generate.bind(module.get<DtoGeneratorService>(DtoGeneratorService));
    mockProductRatingsRepository = module.get(
      getRepositoryToken(ProductRating),
    );
    mockProductsRepository = module.get(getRepositoryToken(Product));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addProductRatingPhoto', () => {
    it('should add product rating photo', async () => {
      const productData = generate(ProductCreateDto);
      const product = mockProductsRepository.save(productData);
      const ratingData = generate(ProductRatingDto);
      const rating = mockProductRatingsRepository.save({
        ...ratingData,
        product,
        user: { id: 123 },
      });
      const fileMetadata = generateFileMetadata();
      const updated = await service.addProductRatingPhoto(
        product.id,
        rating.id,
        fileMetadata,
      );
      expect(updated.photos).toHaveLength(1);
      expect(
        mockProductRatingsRepository.entities.find((r) => r.id === rating.id)
          ?.photos,
      ).toEqual([
        {
          path: fileMetadata.path,
          mimeType: 'image/jpeg',
          thumbnailPath: fileMetadata.path + '-thumbnail',
          placeholderBase64: 'placeholder',
        },
      ]);
    });

    it('should throw error if product or rating does not exist', async () => {
      await expect(
        service.addProductRatingPhoto(12345, 12345, generateFileMetadata()),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteProductRatingPhoto', () => {
    it('should delete product rating photo', async () => {
      const productData = generate(ProductCreateDto);
      const product = mockProductsRepository.save(productData);
      const ratingData = generate(ProductRatingDto);
      const rating = mockProductRatingsRepository.save({
        ...ratingData,
        product,
        user: { id: 123 },
      });
      const photoId = (
        await service.addProductRatingPhoto(
          product.id,
          rating.id,
          generateFileMetadata(),
        )
      ).photos[0].id;
      const updated = await service.deleteProductRatingPhoto(
        product.id,
        rating.id,
        photoId,
      );
      expect(updated.photos).toHaveLength(0);
      expect(
        mockProductRatingsRepository.entities.find((r) => r.id === rating.id)
          ?.photos,
      ).toEqual([]);
    });

    it('should throw error if product or rating does not exist', async () => {
      await expect(
        service.deleteProductRatingPhoto(12345, 12345, 12345),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
