import { Test, TestingModule } from '@nestjs/testing';
import { ProductPhotosService } from './product-photos.service';
import { DtoGeneratorService } from '../../../../test/utils/dto-generator/dto-generator.service';
import { RepositoryMockService } from '../../../../test/utils/repository-mock/repository-mock.service';
import { Product } from '../models/product.entity';
import { ProductPhoto } from './models/product-photo.entity';
import { LocalFilesService } from '../../../local-files/local-files.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductCreateDto } from '../dto/product-create.dto';
import { generateFileMetadata } from '../../../../test/utils/generate-file-metadata';
import { NotFoundError } from '../../../errors/not-found.error';

describe('ProductPhotosService', () => {
  let service: ProductPhotosService;
  let generate: DtoGeneratorService['generate'];
  let mockProductsRepository: RepositoryMockService<Product>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductPhotosService,
        RepositoryMockService.getProvider(Product),
        RepositoryMockService.getProvider(ProductPhoto),
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
      ],
    }).compile();

    service = module.get<ProductPhotosService>(ProductPhotosService);
    generate = module
      .get<DtoGeneratorService>(DtoGeneratorService)
      .generate.bind(module.get<DtoGeneratorService>(DtoGeneratorService));
    mockProductsRepository = module.get(getRepositoryToken(Product));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addProductPhoto', () => {
    it('should add product photo', async () => {
      const product = generate(ProductCreateDto);
      const { id } = mockProductsRepository.save(product);
      const fileMetadata = generateFileMetadata();
      const updated = await service.addProductPhoto(id, fileMetadata);
      expect(updated.photos).toHaveLength(1);
      expect(
        mockProductsRepository.entities.find((p) => p.id === id)?.photos,
      ).toEqual([
        {
          path: fileMetadata.path,
          mimeType: 'image/jpeg',
          thumbnailPath: fileMetadata.path + '-thumbnail',
          placeholderBase64: 'placeholder',
        },
      ]);
    });

    it('should throw error if product not found', async () => {
      const fileMetadata = generateFileMetadata();
      await expect(
        service.addProductPhoto(12345, fileMetadata),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteProductPhoto', () => {
    it('should delete product photo', async () => {
      const createData = generate(ProductCreateDto);
      const { id } = mockProductsRepository.save(createData);
      const photoId = (
        await service.addProductPhoto(id, generateFileMetadata())
      ).photos[0].id;
      const updated = await service.deleteProductPhoto(id, photoId);
      expect(updated).toBeDefined();
      expect(updated.photos).toHaveLength(0);
      expect(
        mockProductsRepository.entities.find((p) => p.id === id)?.photos,
      ).toEqual([]);
    });

    it('should throw error if product not found', async () => {
      await expect(service.deleteProductPhoto(12345, 12345)).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
