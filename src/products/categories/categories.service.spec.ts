import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { Product } from '../entities/product.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from '../entities/category.entity';
import { DtoGeneratorService } from '../../../test/utils/dto-generator/dto-generator.service';
import { CategoryCreateDto } from '../dto/category-create.dto';
import { CategoryUpdateDto } from '../dto/category-update.dto';
import { ProductCreateDto } from '../dto/product-create.dto';
import { RepositoryMockService } from '../../../test/utils/repository-mock/repository-mock.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let generate: DtoGeneratorService['generate'];
  let mockProductsRepository: RepositoryMockService<Product>;
  let mockCategoriesRepository: RepositoryMockService<Category>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getRepositoryToken(Product),
          useValue: new RepositoryMockService(Product),
        },
        {
          provide: getRepositoryToken(Category),
          useValue: new RepositoryMockService(Category),
        },
        DtoGeneratorService,
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    generate = module
      .get<DtoGeneratorService>(DtoGeneratorService)
      .generate.bind(module.get<DtoGeneratorService>(DtoGeneratorService));
    mockProductsRepository = module.get(getRepositoryToken(Product));
    mockCategoriesRepository = module.get(getRepositoryToken(Category));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCategories', () => {
    it('should return all categories', async () => {
      const categories = await service.getCategories();
      expect(categories).toEqual(mockCategoriesRepository.entities);
    });
  });

  describe('getCategory', () => {
    it('should return a category', async () => {
      const createData = generate(CategoryCreateDto);
      const { id } = mockCategoriesRepository.save(createData);
      const category = await service.getCategory(id);
      expect(category).toEqual(
        mockCategoriesRepository.findOne({ where: { id } }),
      );
    });

    it('should return null if category not found', async () => {
      const category = await service.getCategory(12345);
      expect(category).toBeNull();
    });
  });

  describe('createCategory', () => {
    it('should create a category', async () => {
      const createData = generate(CategoryCreateDto);
      const created = await service.createCategory(createData);
      expect(created).toEqual({
        id: expect.any(Number),
        ...createData,
        childCategories: [],
        products: [],
        parentCategory: null,
        slug: null,
      });
      expect(
        mockCategoriesRepository.entities.find((c) => c.id === created.id),
      ).toEqual({
        id: expect.any(Number),
        ...createData,
        childCategories: [],
        products: [],
        parentCategory: null,
        slug: null,
      });
    });
  });

  describe('updateCategory', () => {
    it('should update a category', async () => {
      const createData = generate(CategoryCreateDto);
      const { id } = mockCategoriesRepository.save(createData);
      const updateData = generate(CategoryUpdateDto, true);
      const updated = await service.updateCategory(id, updateData);
      expect(updated).toEqual({
        ...updateData,
        id,
        childCategories: [],
        products: [],
        parentCategory: null,
        parentCategoryId: undefined,
        slug: expect.any(String),
      });
      expect(
        mockCategoriesRepository.entities.find((c) => c.id === updated.id),
      ).toEqual({
        ...updateData,
        id,
        childCategories: [],
        products: [],
        parentCategory: null,
        parentCategoryId: undefined,
        slug: expect.any(String),
      });
    });

    it('should return null if category not found', async () => {
      const updateData = generate(CategoryUpdateDto, true);
      const updated = await service.updateCategory(12345, updateData);
      expect(updated).toBeNull();
    });
  });

  describe('deleteCategory', () => {
    it('should delete a category', async () => {
      const createData = generate(CategoryCreateDto);
      const { id } = mockCategoriesRepository.save(createData);
      const deleted = await service.deleteCategory(id);
      expect(deleted).toBe(true);
      expect(
        mockCategoriesRepository.entities.find((c) => c.id === id),
      ).toBeUndefined();
    });

    it('should return false if category not found', async () => {
      const deleted = await service.deleteCategory(12345);
      expect(deleted).toBe(false);
    });
  });

  describe('getCategoryProducts', () => {
    it('should return all products of a category', async () => {
      const createData = generate(CategoryCreateDto);
      const { id } = mockCategoriesRepository.save(createData);
      const products = await service.getCategoryProducts(id);
      expect(products).toEqual(
        mockCategoriesRepository.entities.find((c) => c.id === id).products,
      );
    });

    it('should return null if category not found', async () => {
      const products = await service.getCategoryProducts(12345);
      expect(products).toBeNull();
    });
  });

  describe('addCategoryProduct', () => {
    it('should add a product to a category', async () => {
      const createData = generate(CategoryCreateDto);
      const { id } = mockCategoriesRepository.save(createData);
      const productData = generate(ProductCreateDto, true);
      const { id: productId } = mockProductsRepository.save(productData);
      const product = await service.addCategoryProduct(id, productId);
      expect(product).toEqual({
        id: expect.any(Number),
        ...productData,
        attributes: [],
        photos: [],
        created: expect.any(Date),
        updated: expect.any(Date),
      });
      expect(
        mockCategoriesRepository.entities.find((c) => c.id === id).products,
      ).toEqual([product]);
    });

    it('should return null if category not found', async () => {
      const product = await service.addCategoryProduct(12345, 12345);
      expect(product).toBeNull();
    });
  });

  describe('deleteCategoryProduct', () => {
    it('should delete a product from a category', async () => {
      const createData = generate(CategoryCreateDto);
      const { id } = mockCategoriesRepository.save(createData);
      const productData = generate(ProductCreateDto);
      const { id: productId } = mockProductsRepository.save(productData);
      await service.addCategoryProduct(id, productId);
      const deleted = await service.deleteCategoryProduct(id, productId);
      expect(deleted).toBe(true);
      expect(
        mockCategoriesRepository.entities.find((c) => c.id === id).products,
      ).toEqual([]);
    });

    it('should return false if category not found', async () => {
      const deleted = await service.deleteCategoryProduct(12345, 12345);
      expect(deleted).toBe(false);
    });
  });
});
