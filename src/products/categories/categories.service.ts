import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from '../entities/category.entity';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { CategoryCreateDto } from '../dto/category-create.dto';
import { CategoryUpdateDto } from '../dto/category-update.dto';

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
    return this.categoriesRepository.findOne({
      where: { id },
      relations: ['childCategories'],
    });
  }

  async createCategory(
    categoryData: CategoryCreateDto,
  ): Promise<Category | null> {
    const category = new Category();
    Object.assign(category, categoryData);
    if (categoryData.parentCategoryId) {
      const updated = await this.updateParentCategory(
        category,
        categoryData.parentCategoryId,
      );
      if (!updated) {
        return null;
      }
    }
    return this.categoriesRepository.save(category);
  }

  async updateCategory(
    id: number,
    categoryData: CategoryUpdateDto,
  ): Promise<Category | null> {
    const category = await this.categoriesRepository.findOne({ where: { id } });
    if (!category) {
      return null;
    }
    Object.assign(category, categoryData);
    if (categoryData.parentCategoryId) {
      const updated = await this.updateParentCategory(
        category,
        categoryData.parentCategoryId,
      );
      if (!updated) {
        return null;
      }
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
      return false;
    }
    category.parentCategory = parentCategory;
    return true;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const category = await this.categoriesRepository.findOne({ where: { id } });
    if (!category) {
      return false;
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
      return null;
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
      return null;
    }
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['products'],
    });
    if (!category) {
      return null;
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
      return false;
    }
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['products'],
    });
    if (!category) {
      return false;
    }
    if (!category.products.some((p) => p.id === product.id)) {
      return false;
    }
    category.products = category.products.filter((p) => p.id !== product.id);
    await this.categoriesRepository.save(category);
    return true;
  }
}
