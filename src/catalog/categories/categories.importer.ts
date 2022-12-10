import { Injectable } from '@nestjs/common';
import { Importer } from '../../import-export/models/importer.interface';
import { Collection } from '../../import-export/models/collection.type';
import { ParseError } from '../../errors/parse.error';
import { IdMap } from '../../import-export/models/id-map.type';
import { CategoriesService } from './categories.service';
import { Category } from './models/category.entity';
import { CategoryGroup } from './models/category-group.entity';
import { Product } from '../products/models/product.entity';

@Injectable()
export class CategoriesImporter implements Importer {
  constructor(private categoriesService: CategoriesService) {}

  async import(
    categories: Collection,
    idMaps: Record<string, IdMap>,
  ): Promise<IdMap> {
    const parsedCategories = this.parseCategories(categories, idMaps.products);
    const idMap: IdMap = {};
    for (const category of parsedCategories) {
      const { id, parentCategory, products, ...createDto } = category;
      const { id: newId } = await this.categoriesService.createCategory(
        createDto,
      );
      idMap[category.id] = newId;
    }
    for (const category of parsedCategories) {
      await this.categoriesService.updateCategory(idMap[category.id], {
        groups: category.groups,
        parentCategoryId: category.parentCategory
          ? idMap[category.parentCategory.id]
          : undefined,
      });
      for (const product of category.products) {
        await this.categoriesService.addCategoryProduct(
          idMap[category.id],
          product.id,
        );
      }
    }
    return idMap;
  }

  async clear() {
    const categories = await this.categoriesService.getCategories();
    let deleted = 0;
    for (const category of categories) {
      await this.categoriesService.deleteCategory(category.id);
      deleted += 1;
    }
    return deleted;
  }

  private parseCategories(categories: Collection, productsIdMap: IdMap) {
    const parsedCategories: Category[] = [];
    for (const category of categories) {
      parsedCategories.push(this.parseCategory(category, productsIdMap));
    }
    return parsedCategories;
  }

  private parseCategory(category: Collection[number], productsIdMap: IdMap) {
    const parsedCategory = new Category();
    try {
      parsedCategory.id = category.id as number;
      parsedCategory.name = category.name as string;
      parsedCategory.description = category.description as string;
      parsedCategory.slug = category.slug as string;
      parsedCategory.parentCategory = {
        id: category.parentCategoryId as number,
      } as Category;
      if (typeof category.groups === 'string') {
        category.groups = JSON.parse(category.groups);
      }
      parsedCategory.groups = (category.groups as Collection).map((group) =>
        this.parseCategoryGroup(group),
      );
      if (typeof category.products === 'string') {
        category.products = JSON.parse(category.products);
      }
      parsedCategory.products = (category.products as Collection).map(
        (product) => this.parseCategoryProduct(product, productsIdMap),
      );
    } catch (e) {
      throw new ParseError('category');
    }
    return parsedCategory;
  }

  private parseCategoryGroup(group: Collection[number]) {
    const parsedGroup = new CategoryGroup();
    try {
      parsedGroup.name = group.name as string;
    } catch (e) {
      throw new ParseError('category group');
    }
    return parsedGroup;
  }

  private parseCategoryProduct(
    product: Collection[number],
    productsIdMap: IdMap,
  ) {
    try {
      return { id: productsIdMap[product.id as number] as number } as Product;
    } catch (e) {
      throw new ParseError('category product');
    }
  }
}
