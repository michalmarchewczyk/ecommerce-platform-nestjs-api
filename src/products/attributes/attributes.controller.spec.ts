import { Test, TestingModule } from '@nestjs/testing';
import { AttributesController } from './attributes.controller';
import { AttributesService } from './attributes.service';

describe('AttributesController', () => {
  let controller: AttributesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttributesController],
      providers: [
        {
          provide: AttributesService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<AttributesController>(AttributesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
