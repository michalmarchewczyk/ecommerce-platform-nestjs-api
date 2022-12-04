import { Injectable } from '@nestjs/common';
import { Exporter } from '../../import-export/models/exporter.interface';
import { Category } from './models/category.entity';
import { CategoriesService } from './categories.service';

@Injectable()
export class CategoriesExporter implements Exporter<Category> {
  constructor(private categoriesService: CategoriesService) {}

  async export(): Promise<Category[]> {
    const categories = await this.categoriesService.getCategories(true);
    const preparedCategories: Category[] = [];
    for (const category of categories) {
      preparedCategories.push(this.prepareCategory(category));
    }
    return preparedCategories;
  }

  private prepareCategory(category: Category) {
    const preparedCategory = new Category() as any;
    preparedCategory.id = category.id;
    preparedCategory.name = category.name;
    preparedCategory.description = category.description;
    preparedCategory.slug = category.slug;
    preparedCategory.parentCategoryId = category.parentCategory?.id;
    preparedCategory.groups = category.groups.map(({ name }) => ({ name }));
    preparedCategory.products = category.products.map(({ id }) => ({ id }));
    return preparedCategory;
  }
}
