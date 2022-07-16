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

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let generate: DtoGeneratorService['generate'];
  const mockProductsRepository = {
    products: [],
    save(product): Product {
      const id = product.id ?? Math.floor(Math.random() * 1000000);
      this.products.push({
        visible: true,
        attributes: [],
        photos: [],
        ...product,
        id,
      });
      return {
        visible: true,
        attributes: [],
        photos: [],
        ...product,
        id,
      } as Product;
    },
    find(): Product[] {
      return this.products;
    },
    findOne(options: { where: { id?: number } }): Product | null {
      const product = this.products.find((p) => p.id === options.where.id);
      return product ?? null;
    },
    delete(where: { id: number }): void {
      this.products = this.products.filter((p) => p.id !== where.id);
    },
  };
  const mockCategoriesRepository = {
    categories: [],
    save(category): Category {
      const id = category.id ?? Math.floor(Math.random() * 1000000);
      this.categories.push({
        childCategories: [],
        products: [],
        ...category,
        id,
      });
      return {
        childCategories: [],
        products: [],
        ...category,
        id,
      } as Category;
    },
    find(): Category[] {
      return this.categories;
    },
    findOne(options: { where: { id?: number } }): Category | null {
      const category = this.categories.find((c) => c.id === options.where.id);
      return category ?? null;
    },
    delete(where: { id: number }): void {
      this.categories = this.categories.filter((c) => c.id !== where.id);
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        CategoriesService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductsRepository,
        },
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoriesRepository,
        },
        DtoGeneratorService,
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
    generate = module
      .get<DtoGeneratorService>(DtoGeneratorService)
      .generate.bind(module.get<DtoGeneratorService>(DtoGeneratorService));
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCategories', () => {
    it('should return all categories', async () => {
      const categories = await controller.getCategories();
      expect(categories).toEqual(mockCategoriesRepository.categories);
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
      });
      expect(
        mockCategoriesRepository.categories.find((c) => c.id === created.id),
      ).toEqual({
        id: expect.any(Number),
        ...createData,
        childCategories: [],
        products: [],
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
      });
      expect(
        mockCategoriesRepository.categories.find((c) => c.id === updated.id),
      ).toEqual({
        id,
        ...updateData,
        childCategories: [],
        products: [],
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
        mockCategoriesRepository.categories.find((c) => c.id === id),
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
        mockCategoriesRepository.categories.find((c) => c.id === id).products,
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
      });
      expect(
        mockCategoriesRepository.categories.find((c) => c.id === id).products,
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
        mockCategoriesRepository.categories.find((c) => c.id === id).products,
      ).toEqual([]);
    });

    it('should throw error if category not found', async () => {
      await expect(
        controller.deleteCategoryProduct(12345, 12345),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
