import { Test, TestingModule } from '@nestjs/testing';
import { ProductPhotosController } from './product-photos.controller';
import { DtoGeneratorService } from '../../../../test/utils/dto-generator/dto-generator.service';
import { RepositoryMockService } from '../../../../test/utils/repository-mock/repository-mock.service';
import { Product } from '../models/product.entity';
import { ProductPhoto } from './models/product-photo.entity';
import { LocalFilesService } from '../../../local-files/local-files.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductCreateDto } from '../dto/product-create.dto';
import { generateFileMetadata } from '../../../../test/utils/generate-file-metadata';
import { NotFoundError } from '../../../errors/not-found.error';
import { ProductPhotosService } from './product-photos.service';

describe('ProductPhotosController', () => {
  let controller: ProductPhotosController;
  let generate: DtoGeneratorService['generate'];
  let mockProductsRepository: RepositoryMockService<Product>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductPhotosController],
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

    controller = module.get<ProductPhotosController>(ProductPhotosController);
    generate = module
      .get<DtoGeneratorService>(DtoGeneratorService)
      .generate.bind(module.get<DtoGeneratorService>(DtoGeneratorService));
    mockProductsRepository = module.get(getRepositoryToken(Product));
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('addProductPhoto', () => {
    it('should add product photo', async () => {
      const createData = generate(ProductCreateDto);
      const { id } = mockProductsRepository.save(createData);
      const fileMetadata = generateFileMetadata();
      const updated = await controller.addProductPhoto(id, fileMetadata);
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

    it('should throw error when product not found', async () => {
      const fileMetadata = generateFileMetadata();
      await expect(
        controller.addProductPhoto(12345, fileMetadata),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteProductPhoto', () => {
    it('should delete product photo', async () => {
      const createData = generate(ProductCreateDto);
      const { id } = mockProductsRepository.save(createData);
      const photoId = (
        await controller.addProductPhoto(id, generateFileMetadata())
      ).photos[0].id;
      const updated = await controller.deleteProductPhoto(id, photoId);
      expect(updated).toBeDefined();
      expect(updated.photos).toHaveLength(0);
      expect(
        mockProductsRepository.entities.find((p) => p.id === id)?.photos,
      ).toEqual([]);
    });

    it('should throw error when product not found', async () => {
      await expect(controller.deleteProductPhoto(12345, 12345)).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
