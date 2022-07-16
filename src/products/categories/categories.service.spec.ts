import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { Product } from '../entities/product.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from '../entities/category.entity';
import { DtoGeneratorService } from '../../../test/utils/dto-generator/dto-generator.service';
import { CategoryCreateDto } from '../dto/category-create.dto';
import { CategoryUpdateDto } from '../dto/category-update.dto';
import { ProductCreateDto } from '../dto/product-create.dto';

describe('CategoriesService', () => {
  let service: CategoriesService;
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

  beforeAll(async () => {
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
        DtoGeneratorService,
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    generate = module
      .get<DtoGeneratorService>(DtoGeneratorService)
      .generate.bind(module.get<DtoGeneratorService>(DtoGeneratorService));
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
      const updated = await service.updateCategory(id, updateData);
      expect(updated).toEqual({
        ...updateData,
        id,
        childCategories: [],
        products: [],
      });
      expect(
        mockCategoriesRepository.categories.find((c) => c.id === updated.id),
      ).toEqual({
        ...updateData,
        id,
        childCategories: [],
        products: [],
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
      const createData = generate(CategoryCreateDto);
      const { id } = mockCategoriesRepository.save(createData);
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
      const createData = generate(CategoryCreateDto);
      const { id } = mockCategoriesRepository.save(createData);
      const productData = generate(ProductCreateDto);
      const { id: productId } = mockProductsRepository.save(productData);
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
