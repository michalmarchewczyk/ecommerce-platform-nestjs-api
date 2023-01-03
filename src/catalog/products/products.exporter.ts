import { Injectable } from '@nestjs/common';
import { Exporter } from '../../import-export/models/exporter.interface';
import { Product } from './models/product.entity';
import { ProductsService } from './products.service';
import { Attribute } from './models/attribute.entity';

@Injectable()
export class ProductsExporter implements Exporter<Product> {
  constructor(private productsService: ProductsService) {}

  async export(): Promise<Product[]> {
    const products = await this.productsService.getProducts(true);
    const preparedProducts: Product[] = [];
    for (const product of products) {
      preparedProducts.push(this.prepareProduct(product));
    }
    return preparedProducts;
  }

  private prepareProduct(product: Product) {
    const preparedProduct = new Product();
    preparedProduct.id = product.id;
    preparedProduct.name = product.name;
    preparedProduct.description = product.description;
    preparedProduct.price = product.price;
    preparedProduct.stock = product.stock;
    preparedProduct.visible = product.visible;
    preparedProduct.attributes = product.attributes.map((a) =>
      this.prepareAttribute(a),
    ) as Attribute[];
    return preparedProduct;
  }

  private prepareAttribute(attribute: Product['attributes'][number]) {
    const preparedAttribute: Record<string, any> = {};
    preparedAttribute.value = attribute.value;
    preparedAttribute.typeId = attribute.type.id;
    return preparedAttribute;
  }
}
