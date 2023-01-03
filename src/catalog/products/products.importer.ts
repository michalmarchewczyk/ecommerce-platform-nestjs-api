import { Injectable } from '@nestjs/common';
import { Importer } from '../../import-export/models/importer.interface';
import { Collection } from '../../import-export/models/collection.type';
import { ParseError } from '../../errors/parse.error';
import { IdMap } from '../../import-export/models/id-map.type';
import { ProductsService } from './products.service';
import { Product } from './models/product.entity';
import { Attribute } from './models/attribute.entity';
import { AttributeType } from '../attribute-types/models/attribute-type.entity';

@Injectable()
export class ProductsImporter implements Importer {
  constructor(private productsService: ProductsService) {}

  async import(
    products: Collection,
    idMaps: Record<string, IdMap>,
  ): Promise<IdMap> {
    const parsedProducts = this.parseProducts(products, idMaps.attributeTypes);
    const idMap: IdMap = {};
    for (const product of parsedProducts) {
      const { id, ...createDto } = product;
      const { id: newId } = await this.productsService.createProduct(createDto);
      idMap[product.id] = newId;
    }
    return idMap;
  }

  async clear() {
    const products = await this.productsService.getProducts(true);
    let deleted = 0;
    for (const product of products) {
      await this.productsService.deleteProduct(product.id);
      deleted += 1;
    }
    return deleted;
  }

  private parseProducts(products: Collection, attributeTypesIdMap: IdMap) {
    const parsedProducts: Product[] = [];
    for (const product of products) {
      parsedProducts.push(this.parseProduct(product, attributeTypesIdMap));
    }
    return parsedProducts;
  }

  private parseProduct(
    product: Collection[number],
    attributeTypesIdMap: IdMap,
  ) {
    const parsedProduct = new Product();
    try {
      parsedProduct.id = product.id as number;
      parsedProduct.name = product.name as string;
      parsedProduct.description = product.description as string;
      parsedProduct.price = product.price as number;
      parsedProduct.stock = product.stock as number;
      parsedProduct.visible = product.visible as boolean;
      if (typeof product.attributes === 'string') {
        product.attributes = JSON.parse(product.attributes);
      }
      parsedProduct.attributes = (product.attributes as Collection).map((a) =>
        this.parseAttribute(a, attributeTypesIdMap),
      );
    } catch (e) {
      throw new ParseError('product');
    }
    return parsedProduct;
  }

  private parseAttribute(
    attribute: Collection[number],
    attributeTypesIdMap: IdMap,
  ) {
    const parsedAttribute = new Attribute();
    try {
      parsedAttribute.value = attribute.value as string;
      parsedAttribute.type = {
        id: attributeTypesIdMap[attribute.typeId as number],
      } as AttributeType;
    } catch (e) {
      throw new ParseError('attribute');
    }
    return parsedAttribute;
  }
}
