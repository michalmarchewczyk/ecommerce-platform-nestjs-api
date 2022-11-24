import { Test, TestingModule } from '@nestjs/testing';
import { WishlistsService } from './wishlists.service';
import { RepositoryMockService } from '../../test/utils/repository-mock/repository-mock.service';
import { Wishlist } from './models/wishlist.entity';
import { Product } from '../catalog/products/models/product.entity';
import { DtoGeneratorService } from '../../test/utils/dto-generator/dto-generator.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductCreateDto } from '../catalog/products/dto/product-create.dto';
import { WishlistCreateDto } from './dto/wishlist-create.dto';
import { User } from '../users/models/user.entity';
import { NotFoundError } from '../errors/not-found.error';
import { ProductsService } from '../catalog/products/products.service';
import { AttributeTypesService } from '../catalog/attribute-types/attribute-types.service';
import { AttributeType } from '../catalog/attribute-types/models/attribute-type.entity';
import { Attribute } from '../catalog/products/models/attribute.entity';

describe('WishlistsService', () => {
  let service: WishlistsService;
  let generate: DtoGeneratorService['generate'];
  let mockWishlistsRepository: RepositoryMockService<Wishlist>;
  let mockProductsRepository: RepositoryMockService<Product>;
  let testProduct: Product;
  let testWishlist: Wishlist;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WishlistsService,
        ProductsService,
        AttributeTypesService,
        RepositoryMockService.getProvider(Wishlist),
        RepositoryMockService.getProvider(Product),
        RepositoryMockService.getProvider(AttributeType),
        RepositoryMockService.getProvider(Attribute),
        DtoGeneratorService,
      ],
    }).compile();

    service = module.get<WishlistsService>(WishlistsService);
    generate = module
      .get<DtoGeneratorService>(DtoGeneratorService)
      .generate.bind(module.get<DtoGeneratorService>(DtoGeneratorService));
    mockWishlistsRepository = module.get(getRepositoryToken(Wishlist));
    mockProductsRepository = module.get(getRepositoryToken(Product));

    const productData = generate(ProductCreateDto);
    testProduct = await mockProductsRepository.save(productData);

    const createData = generate(WishlistCreateDto);
    testWishlist = await mockWishlistsRepository.save({
      ...createData,
      user: { id: 123 },
      products: [testProduct],
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserWishlists', () => {
    it('should return user wishlists', async () => {
      const wishlists = await service.getUserWishlists({ id: 123 } as User);
      expect(wishlists).toContainEqual(testWishlist);
    });

    it("shouldn't return other user wishlists", async () => {
      const wishlists = await service.getUserWishlists({ id: 12345 } as User);
      expect(wishlists).toEqual([]);
    });
  });

  describe('createWishlist', () => {
    it('should create wishlist', async () => {
      const createData = generate(WishlistCreateDto);
      createData.productIds = [testProduct.id];
      const wishlist = await service.createWishlist(
        { id: 123 } as User,
        createData,
      );
      expect(wishlist).toMatchObject({ name: createData.name });
    });

    it('should return error if product not found', async () => {
      const createData = generate(WishlistCreateDto);
      createData.productIds = [12345];
      await expect(
        service.createWishlist({ id: 123 } as User, createData),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateWishlist', () => {
    it('should update wishlist', async () => {
      const createData = generate(WishlistCreateDto);
      createData.productIds = [];
      const { id } = await service.createWishlist(
        { id: 123 } as User,
        createData,
      );
      const updateData = generate(WishlistCreateDto, true);
      updateData.productIds = [testProduct.id];
      const wishlist = await service.updateWishlist(
        { id: 123 } as User,
        id,
        updateData,
      );
      expect(wishlist).toMatchObject({ name: updateData.name });
    });

    it('should return error if product not found', async () => {
      const createData = generate(WishlistCreateDto);
      createData.productIds = [];
      const { id } = await service.createWishlist(
        { id: 123 } as User,
        createData,
      );
      const updateData = generate(WishlistCreateDto, true);
      updateData.productIds = [12345];
      await expect(
        service.updateWishlist({ id: 123 } as User, id, updateData),
      ).rejects.toThrow(NotFoundError);
    });

    it('should return error if wishlist not found', async () => {
      const updateData = generate(WishlistCreateDto, true);
      await expect(
        service.updateWishlist({ id: 123 } as User, 12345, updateData),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteWishlist', () => {
    it('should delete wishlist', async () => {
      const createData = generate(WishlistCreateDto);
      createData.productIds = [];
      const { id } = await service.createWishlist(
        { id: 123 } as User,
        createData,
      );
      await service.deleteWishlist({ id: 123 } as User, id);
      expect(
        mockWishlistsRepository.entities.find((w) => w.id === id),
      ).toBeUndefined();
    });

    it('should return error if wishlist not found', async () => {
      await expect(
        service.deleteWishlist({ id: 123 } as User, 12345),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
