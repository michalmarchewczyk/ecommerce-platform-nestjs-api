import { Test, TestingModule } from '@nestjs/testing';
import { ProductRatingsController } from './product-ratings.controller';
import { DtoGeneratorService } from '../../../test/utils/dto-generator/dto-generator.service';
import { RepositoryMockService } from '../../../test/utils/repository-mock/repository-mock.service';
import { ProductRating } from './models/product-rating.entity';
import { Product } from '../products/models/product.entity';
import { ProductRatingsService } from './product-ratings.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductCreateDto } from '../products/dto/product-create.dto';
import { ProductRatingDto } from './dto/product-rating.dto';
import { User } from '../../users/models/user.entity';
import { NotFoundError } from '../../errors/not-found.error';
import { ProductRatingPhoto } from './product-rating-photos/models/product-rating-photo.entity';
import { SettingsService } from '../../settings/settings.service';
import { ProductsService } from '../products/products.service';
import { AttributeTypesService } from '../attribute-types/attribute-types.service';
import { AttributeType } from '../attribute-types/models/attribute-type.entity';
import { Attribute } from '../products/models/attribute.entity';

describe('ProductRatingsController', () => {
  let controller: ProductRatingsController;
  let generate: DtoGeneratorService['generate'];
  let mockProductRatingsRepository: RepositoryMockService<ProductRating>;
  let mockProductsRepository: RepositoryMockService<Product>;
  let testProduct: Product;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductRatingsController],
      providers: [
        ProductRatingsService,
        ProductsService,
        AttributeTypesService,
        RepositoryMockService.getProvider(ProductRating),
        RepositoryMockService.getProvider(Product),
        RepositoryMockService.getProvider(ProductRatingPhoto),
        RepositoryMockService.getProvider(AttributeType),
        RepositoryMockService.getProvider(Attribute),
        DtoGeneratorService,
        {
          provide: SettingsService,
          useValue: {
            getSettingValueByName: jest.fn(() => 'true'),
          },
        },
      ],
    }).compile();

    controller = module.get<ProductRatingsController>(ProductRatingsController);
    generate = module
      .get<DtoGeneratorService>(DtoGeneratorService)
      .generate.bind(module.get<DtoGeneratorService>(DtoGeneratorService));
    mockProductRatingsRepository = module.get(
      getRepositoryToken(ProductRating),
    );
    mockProductsRepository = module.get(getRepositoryToken(Product));

    const productData = generate(ProductCreateDto);
    testProduct = mockProductsRepository.save(productData);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProductRatings', () => {
    it('should return product ratings for given product', async () => {
      const productRating = mockProductRatingsRepository.save({
        ...generate(ProductRatingDto),
        product: testProduct,
      });
      const productRatings = await controller.getProductRatings(testProduct.id);
      expect(productRatings).toContainEqual(productRating);
    });

    it('should return empty array if product does not exist', async () => {
      const productRatings = await controller.getProductRatings(12345);
      expect(productRatings).toEqual([]);
    });
  });

  describe('createProductRating', () => {
    it('should create product rating for given product', async () => {
      const createData = generate(ProductRatingDto, true);
      const productRating = await controller.createProductRating(
        { id: 123 } as User,
        testProduct.id,
        createData,
      );
      expect(productRating).toBeDefined();
      expect(productRating).toEqual({
        ...createData,
        product: testProduct,
        user: { id: 123 },
        created: expect.any(Date),
        updated: expect.any(Date),
        id: expect.any(Number),
        photos: [],
      });
    });

    it('should throw error if product does not exist', async () => {
      const createData = generate(ProductRatingDto);
      await expect(
        controller.createProductRating({ id: 1 } as User, 12345, createData),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateProductRating', () => {
    it('should update product rating', async () => {
      const productRating = mockProductRatingsRepository.save({
        ...generate(ProductRatingDto),
        product: testProduct,
        user: { id: 123 },
      });
      const updateData = generate(ProductRatingDto);
      const updatedProductRating = await controller.updateProductRating(
        { id: 123 } as User,
        testProduct.id,
        productRating.id,
        updateData,
      );
      expect(updatedProductRating).toBeDefined();
      expect(updatedProductRating).toEqual({
        ...productRating,
        ...updateData,
      });
    });

    it('should throw error if product or rating does not exist', async () => {
      const updateData = generate(ProductRatingDto);
      await expect(
        controller.updateProductRating(
          { id: 123 } as User,
          12345,
          12345,
          updateData,
        ),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteProductRating', () => {
    it('should delete product rating', async () => {
      const productRating = mockProductRatingsRepository.save({
        ...generate(ProductRatingDto),
        product: testProduct,
        user: { id: 123 },
      });
      await controller.deleteProductRating(
        { id: 123 } as User,
        testProduct.id,
        productRating.id,
      );
      expect(
        mockProductRatingsRepository.entities.find(
          (r) => r.id === productRating.id,
        ),
      ).toBeUndefined();
    });

    it('should throw error if product or rating does not exist', async () => {
      await expect(
        controller.deleteProductRating({ id: 123 } as User, 12345, 12345),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
