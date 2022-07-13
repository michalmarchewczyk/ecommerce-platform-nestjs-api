import { Test, TestingModule } from '@nestjs/testing';
import { AttributesService } from './attributes.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AttributeType } from '../entities/attribute-type.entity';

describe('AttributesService', () => {
  let service: AttributesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttributesService,
        {
          provide: getRepositoryToken(AttributeType),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<AttributesService>(AttributesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
