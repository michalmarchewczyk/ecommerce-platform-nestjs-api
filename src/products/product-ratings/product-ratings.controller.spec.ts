import { Test, TestingModule } from '@nestjs/testing';
import { ProductRatingsController } from './product-ratings.controller';

describe('ProductRatingsController', () => {
  let controller: ProductRatingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductRatingsController],
    }).compile();

    controller = module.get<ProductRatingsController>(ProductRatingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
