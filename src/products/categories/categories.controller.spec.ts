import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { Product } from '../entities/product.entity';
import { Category } from '../entities/category.entity';
import { CategoriesService } from './categories.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { DtoGeneratorService } from '../../../test/utils/dto-generator/dto-generator.service';
import { CategoryCreateDto } from '../dto/category-create.dto';
import { CategoryUpdateDto } from '../dto/category-update.dto';
import { ProductCreateDto } from '../dto/product-create.dto';
import { RepositoryMockService } from '../../../test/utils/repository-mock/repository-mock.service';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let generate: DtoGeneratorService['generate'];
  let mockProductsRepository: RepositoryMockService<Product>;
  let mockCategoriesRepository: RepositoryMockService<Category>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
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

    controller = module.get<CategoriesController>(CategoriesController);
    generate = module
      .get<DtoGeneratorService>(DtoGeneratorService)
      .generate.bind(module.get<DtoGeneratorService>(DtoGeneratorService));
    mockProductsRepository = module.get(getRepositoryToken(Product));
    mockCategoriesRepository = module.get(getRepositoryToken(Category));
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCategories', () => {
    it('should return all categories', async () => {
      const categories = await controller.getCategories();
      expect(categories).toEqual(mockCategoriesRepository.entities);
    });
  });

  describe('getCategory', () => {
    it('should return a category', async () => {
      const createData = generate(CategoryCreateDto);
      const { id } = mockCategoriesRepository.save(createData);
      const category = await controller.getCategory(id);
      expect(category).toEqual({
        id,
        ...createData,
        childCategories: [],
        products: [],
        parentCategory: null,
        slug: null,
      });
    });

    it('should throw error if category not found', async () => {
      await expect(controller.getCategory(12345)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createCategory', () => {
    it('should create a category', async () => {
      const createData = generate(CategoryCreateDto);
      const created = await controller.createCategory(createData);
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
      const updated = await controller.updateCategory(id, updateData);
      expect(updated).toEqual({
        id,
        ...updateData,
        childCategories: [],
        products: [],
        parentCategory: null,
      });
      expect(
        mockCategoriesRepository.entities.find((c) => c.id === updated.id),
      ).toEqual({
        id,
        ...updateData,
        childCategories: [],
        products: [],
        parentCategory: null,
      });
    });

    it('should throw error if category not found', async () => {
      await expect(controller.updateCategory(12345, {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteCategory', () => {
    it('should delete a category', async () => {
      const createData = generate(CategoryCreateDto);
      const { id } = mockCategoriesRepository.save(createData);
      await controller.deleteCategory(id);
      expect(
        mockCategoriesRepository.entities.find((c) => c.id === id),
      ).toBeUndefined();
    });

    it('should throw error if category not found', async () => {
      await expect(controller.deleteCategory(12345)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getCategoryProducts', () => {
    it('should return all products of a category', async () => {
      const createData = generate(CategoryCreateDto);
      const { id } = mockCategoriesRepository.save(createData);
      const products = await controller.getCategoryProducts(id);
      expect(products).toEqual(
        mockCategoriesRepository.entities.find((c) => c.id === id).products,
      );
    });

    it('should throw error if category not found', async () => {
      await expect(controller.getCategoryProducts(12345)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addCategoryProduct', () => {
    it('should add a product to a category', async () => {
      const createData = generate(CategoryCreateDto);
      const { id } = mockCategoriesRepository.save(createData);
      const productData = generate(ProductCreateDto, true);
      const { id: productId } = mockProductsRepository.save(productData);
      const product = await controller.addCategoryProduct(id, productId);
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

    it('should throw error if category not found', async () => {
      await expect(controller.addCategoryProduct(12345, 12345)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteCategoryProduct', () => {
    it('should delete a product from a category', async () => {
      const createData = generate(CategoryCreateDto);
      const { id } = mockCategoriesRepository.save(createData);
      const productData = generate(ProductCreateDto, true);
      const { id: productId } = mockProductsRepository.save(productData);
      await controller.addCategoryProduct(id, productId);
      await controller.deleteCategoryProduct(id, productId);
      expect(
        mockCategoriesRepository.entities.find((c) => c.id === id).products,
      ).toEqual([]);
    });

    it('should throw error if category not found', async () => {
      await expect(
        controller.deleteCategoryProduct(12345, 12345),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
