import { Test, TestingModule } from '@nestjs/testing';
import { CartsService } from './carts.service';
import { RepositoryMockService } from '../../test/utils/repository-mock/repository-mock.service';
import { Cart } from './models/cart.entity';
import { ProductsService } from '../catalog/products/products.service';
import { User } from '../users/models/user.entity';

describe('CartsService', () => {
  let service: CartsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartsService,
        RepositoryMockService.getProvider(Cart),
        {
          provide: ProductsService,
          useValue: {
            getProduct: (id: number) => ({ id, name: 'product ' + id }),
          },
        },
      ],
    }).compile();

    service = module.get<CartsService>(CartsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCart', () => {
    it('should create users cart if it does not exist', async () => {
      const cart = await service.getCart({ id: 1 } as User);
      expect(cart).toBeDefined();
      expect(cart.products).toEqual([]);
    });

    it('should create session cart if it does not exist', async () => {
      const cart = await service.getCart(null, '123456789');
      expect(cart).toBeDefined();
      expect(cart.products).toEqual([]);
    });

    it('should return users cart if it exists', async () => {
      const cart = await service.getCart({ id: 2 } as User);
      const cart2 = await service.getCart({ id: 2 } as User);
      expect(cart).toStrictEqual(cart2);
    });

    it('should return session cart if it exists', async () => {
      const cart = await service.getCart(null, '12345');
      const cart2 = await service.getCart(null, '12345');
      expect(cart).toStrictEqual(cart2);
    });
  });

  describe('updateCart', () => {
    it('should update users cart', async () => {
      const cart = await service.getCart({ id: 3 } as User);
      await service.updateCart({ productIds: [1, 2] }, { id: 3 } as User);
      expect(cart.products).toEqual([
        { id: 1, name: 'product 1' },
        { id: 2, name: 'product 2' },
      ]);
    });

    it('should update session cart', async () => {
      const cart = await service.getCart(null, '123');
      await service.updateCart({ productIds: [10, 20] }, null, '123');
      expect(cart.products).toEqual([
        { id: 10, name: 'product 10' },
        { id: 20, name: 'product 20' },
      ]);
    });
  });
});
