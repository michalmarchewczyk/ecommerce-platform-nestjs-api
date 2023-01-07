import { Test, TestingModule } from '@nestjs/testing';
import { CartsController } from './carts.controller';
import { CartsService } from './carts.service';
import { RepositoryMockService } from '../../test/utils/repository-mock/repository-mock.service';
import { Cart } from './models/cart.entity';
import { ProductsService } from '../catalog/products/products.service';
import { User } from '../users/models/user.entity';

describe('CartsController', () => {
  let controller: CartsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartsController],
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

    controller = module.get<CartsController>(CartsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCart', () => {
    it('should create users cart if it does not exist', async () => {
      const cart = await controller.getCart({ id: 1 } as User, {});
      expect(cart).toBeDefined();
      expect(cart.items).toEqual([]);
    });

    it('should create session cart if it does not exist', async () => {
      const cart = await controller.getCart(null, { id: '123456789' });
      expect(cart).toBeDefined();
      expect(cart.items).toEqual([]);
    });

    it('should return users cart if it exists', async () => {
      const cart = await controller.getCart({ id: 2 } as User, {});
      const cart2 = await controller.getCart({ id: 2 } as User, {});
      expect(cart).toStrictEqual(cart2);
    });

    it('should return session cart if it exists', async () => {
      const cart = await controller.getCart(null, { id: '12345' });
      const cart2 = await controller.getCart(null, { id: '12345' });
      expect(cart).toStrictEqual(cart2);
    });
  });

  describe('updateCart', () => {
    it('should update users cart', async () => {
      const cart = await controller.getCart({ id: 3 } as User, {});
      await controller.updateCart(
        { id: 3 } as User,
        {},
        {
          items: [
            { productId: 1, quantity: 1 },
            { productId: 2, quantity: 2 },
          ],
        },
      );
      expect(cart.items).toEqual([
        { quantity: 1, product: { id: 1, name: 'product 1' } },
        { quantity: 2, product: { id: 2, name: 'product 2' } },
      ]);
    });

    it('should update session cart', async () => {
      const cart = await controller.getCart(null, { id: '123' });
      await controller.updateCart(
        null,
        { id: '123' },
        {
          items: [
            { productId: 10, quantity: 10 },
            { productId: 20, quantity: 20 },
          ],
        },
      );
      expect(cart.items).toEqual([
        { quantity: 10, product: { id: 10, name: 'product 10' } },
        { quantity: 20, product: { id: 20, name: 'product 20' } },
      ]);
    });
  });
});
