import { Test, TestingModule } from '@nestjs/testing';
import { CartsService } from './carts.service';
import { RepositoryMockService } from '../../test/utils/repository-mock/repository-mock.service';
import { Cart } from './models/cart.entity';

describe('CartsService', () => {
  let service: CartsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CartsService, RepositoryMockService.getProvider(Cart)],
    }).compile();

    service = module.get<CartsService>(CartsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
