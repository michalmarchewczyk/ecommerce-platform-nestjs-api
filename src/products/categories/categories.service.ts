import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from '../entities/category.entity';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { CategoryCreateDto } from '../dto/category-create.dto';
import { CategoryUpdateDto } from '../dto/category-update.dto';
import { NotFoundError } from '../../errors/not-found.error';
import { NotRelatedError } from '../../errors/not-related.error';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async getCategories(): Promise<Category[]> {
    return this.categoriesRepository.find();
  }

  async getCategory(id: number): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['childCategories'],
    });
    if (!category) {
      throw new NotFoundError('category', 'id', id.toString());
    }
    return category;
  }

  async createCategory(
    categoryData: CategoryCreateDto,
  ): Promise<Category | null> {
    const category = new Category();
    Object.assign(category, categoryData);
    if (categoryData.parentCategoryId) {
      await this.updateParentCategory(category, categoryData.parentCategoryId);
    }
    return this.categoriesRepository.save(category);
  }

  async updateCategory(
    id: number,
    categoryData: CategoryUpdateDto,
  ): Promise<Category | null> {
    const category = await this.categoriesRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundError('category', 'id', id.toString());
    }
    Object.assign(category, categoryData);
    if (categoryData.parentCategoryId) {
      await this.updateParentCategory(category, categoryData.parentCategoryId);
    }
    return this.categoriesRepository.save(category);
  }

  private async updateParentCategory(
    category: Category,
    parentCategoryId: number,
  ): Promise<boolean> {
    const parentCategory = await this.categoriesRepository.findOne({
      where: { id: parentCategoryId },
    });
    if (!parentCategory) {
      throw new NotFoundError('category', 'id', parentCategoryId.toString());
    }
    category.parentCategory = parentCategory;
    return true;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const category = await this.categoriesRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundError('category', 'id', id.toString());
    }
    await this.categoriesRepository.delete({ id });
    return true;
  }

  async getCategoryProducts(id: number): Promise<Product[] | null> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['products'],
    });
    if (!category) {
      throw new NotFoundError('category', 'id', id.toString());
    }
    return category.products;
  }

  async addCategoryProduct(
    id: number,
    productId: number,
  ): Promise<Product | null> {
    const product = await this.productsRepository.findOne({
      where: { id: productId },
    });
    if (!productId || !product) {
      throw new NotFoundError('product');
    }
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['products'],
    });
    if (!category) {
      throw new NotFoundError('category', 'id', id.toString());
    }
    category.products.push(product);
    await this.categoriesRepository.save(category);
    return product;
  }

  async deleteCategoryProduct(id: number, productId: number): Promise<boolean> {
    const product = await this.productsRepository.findOne({
      where: { id: productId },
    });
    if (!productId || !product) {
      throw new NotFoundError('product');
    }
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['products'],
    });
    if (!category) {
      throw new NotFoundError('category', 'id', id.toString());
    }
    if (!category.products.some((p) => p.id === product.id)) {
      throw new NotRelatedError('category', 'product');
    }
    category.products = category.products.filter((p) => p.id !== product.id);
    await this.categoriesRepository.save(category);
    return true;
  }
}
