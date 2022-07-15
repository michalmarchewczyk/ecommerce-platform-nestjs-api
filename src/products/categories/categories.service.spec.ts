import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { Product } from '../entities/product.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from '../entities/category.entity';

describe('CategoriesService', () => {
  let service: CategoriesService;
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
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCategories', () => {
    it('should return all categories', async () => {
      const categories = await service.getCategories();
      expect(categories).toEqual(mockCategoriesRepository.categories);
    });
  });

  describe('getCategory', () => {
    it('should return a category', async () => {
      const { id } = mockCategoriesRepository.save({
        name: 'Category 1',
        description: 'Description 1',
      });
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
      const category = await service.createCategory({
        name: 'Category 2',
        description: 'Description 2',
      });
      expect(category).toEqual({
        name: 'Category 2',
        description: 'Description 2',
        id: expect.any(Number),
        childCategories: [],
        products: [],
      });
      expect(
        mockCategoriesRepository.categories.find((c) => c.id === category.id),
      ).toEqual({
        name: 'Category 2',
        description: 'Description 2',
        id: expect.any(Number),
        childCategories: [],
        products: [],
      });
    });
  });

  describe('updateCategory', () => {
    it('should update a category', async () => {
      const { id } = mockCategoriesRepository.save({
        name: 'Category 3',
        description: 'Description 3',
      });
      const category = await service.updateCategory(id, {
        name: 'Category 3 updated',
        description: 'Description 3 updated',
      });
      expect(category).toEqual({
        name: 'Category 3 updated',
        description: 'Description 3 updated',
        id,
        childCategories: [],
        products: [],
      });
      expect(
        mockCategoriesRepository.categories.find((c) => c.id === category.id),
      ).toEqual({
        name: 'Category 3 updated',
        description: 'Description 3 updated',
        id,
        childCategories: [],
        products: [],
      });
    });

    it('should return null if category not found', async () => {
      const category = await service.updateCategory(12345, {
        name: 'Category 3 updated',
        description: 'Description 3 updated',
      });
      expect(category).toBeNull();
    });
  });

  describe('deleteCategory', () => {
    it('should delete a category', async () => {
      const { id } = mockCategoriesRepository.save({
        name: 'Category 4',
        description: 'Description 4',
      });
      const deleted = await service.deleteCategory(id);
      expect(deleted).toBe(true);
      expect(
        mockCategoriesRepository.categories.find((c) => c.id === id),
      ).toBeUndefined();
    });

    it('should return false if category not found', async () => {
      const deleted = await service.deleteCategory(12345);
      expect(deleted).toBe(false);
    });
  });

  describe('getCategoryProducts', () => {
    it('should return all products of a category', async () => {
      const { id } = mockCategoriesRepository.save({
        name: 'Category 5',
        description: 'Description 5',
      });
      const products = await service.getCategoryProducts(id);
      expect(products).toEqual(
        mockCategoriesRepository.categories.find((c) => c.id === id).products,
      );
    });

    it('should return null if category not found', async () => {
      const products = await service.getCategoryProducts(12345);
      expect(products).toBeNull();
    });
  });

  describe('addCategoryProduct', () => {
    it('should add a product to a category', async () => {
      const { id } = mockCategoriesRepository.save({
        name: 'Category 6',
        description: 'Description 6',
      });
      const { id: productId } = mockProductsRepository.save({
        name: 'Product 6',
        description: 'Description 6',
        price: 6,
        stock: 6,
      });
      const product = await service.addCategoryProduct(id, productId);
      expect(product).toEqual({
        name: 'Product 6',
        description: 'Description 6',
        id: expect.any(Number),
        price: 6,
        stock: 6,
        attributes: [],
        photos: [],
        visible: true,
      });
      expect(
        mockCategoriesRepository.categories.find((c) => c.id === id).products,
      ).toEqual([product]);
    });

    it('should return null if category not found', async () => {
      const product = await service.addCategoryProduct(12345, 12345);
      expect(product).toBeNull();
    });
  });

  describe('deleteCategoryProduct', () => {
    it('should delete a product from a category', async () => {
      const { id } = mockCategoriesRepository.save({
        name: 'Category 7',
        description: 'Description 7',
      });
      const { id: productId } = mockProductsRepository.save({
        name: 'Product 7',
        description: 'Description 7',
        price: 7,
        stock: 7,
      });
      await service.addCategoryProduct(id, productId);
      const deleted = await service.deleteCategoryProduct(id, productId);
      expect(deleted).toBe(true);
      expect(
        mockCategoriesRepository.categories.find((c) => c.id === id).products,
      ).toEqual([]);
    });

    it('should return false if category not found', async () => {
      const deleted = await service.deleteCategoryProduct(12345, 12345);
      expect(deleted).toBe(false);
    });
  });
});
