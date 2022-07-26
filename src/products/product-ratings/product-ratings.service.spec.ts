import { Test, TestingModule } from '@nestjs/testing';
import { ProductRatingsService } from './product-ratings.service';

describe('ProductRatingsService', () => {
  let service: ProductRatingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductRatingsService],
    }).compile();

    service = module.get<ProductRatingsService>(ProductRatingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
