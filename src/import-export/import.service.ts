import { Injectable } from '@nestjs/common';
import { DataType } from './models/data-type.enum';
import { SettingsImporter } from '../settings/settings.importer';
import { Collection } from './models/collection.type';
import { Importer } from './models/importer.interface';
import { UsersImporter } from '../users/users.importer';
import { AttributeTypesImporter } from '../catalog/attribute-types/attribute-types.importer';
import { IdMap } from './models/id-map.type';
import { dataTypeDependencies } from './models/data-type-dependencies.data';
import { ProductsImporter } from '../catalog/products/products.importer';
import { ZipSerializer } from './zip-serializer.service';
import { JsonSerializer } from './json-serializer.service';
import { checkDataType, checkDataTypeDependencies } from './data-type.utils';
import { CategoriesImporter } from '../catalog/categories/categories.importer';
import { WishlistsImporter } from '../wishlists/wishlists.importer';
import { DeliveryMethodsImporter } from '../sales/delivery-methods/delivery-methods.importer';
import { PaymentMethodsImporter } from '../sales/payment-methods/payment-methods.importer';
import { OrdersImporter } from '../sales/orders/orders.importer';
import { ReturnsImporter } from '../sales/returns/returns.importer';
import { ProductPhotosImporter } from '../catalog/products/product-photos/product-photos.importer';
import { PagesImporter } from '../pages/pages.importer';
import { ImportStatus } from './models/import-status.interface';

@Injectable()
export class ImportService {
  private importers: Record<string, Importer> = {
    [DataType.Settings]: this.settingsImporter,
    [DataType.Pages]: this.pagesImporter,
    [DataType.Users]: this.usersImporter,
    [DataType.AttributeTypes]: this.attributeTypesImporter,
    [DataType.Products]: this.productsImporter,
    [DataType.ProductPhotos]: this.productPhotosImporter,
    [DataType.Categories]: this.categoriesImporter,
    [DataType.Wishlists]: this.wishlistsImporter,
    [DataType.DeliveryMethods]: this.deliveryMethodsImporter,
    [DataType.PaymentMethods]: this.paymentMethodsImporter,
    [DataType.Orders]: this.ordersImporter,
    [DataType.Returns]: this.returnsImporter,
  };
  private idMaps: Record<string, IdMap> = {};

  constructor(
    private jsonSerializer: JsonSerializer,
    private zipSerializer: ZipSerializer,
    private settingsImporter: SettingsImporter,
    private pagesImporter: PagesImporter,
    private usersImporter: UsersImporter,
    private attributeTypesImporter: AttributeTypesImporter,
    private productsImporter: ProductsImporter,
    private productPhotosImporter: ProductPhotosImporter,
    private categoriesImporter: CategoriesImporter,
    private wishlistsImporter: WishlistsImporter,
    private deliveryMethodsImporter: DeliveryMethodsImporter,
    private paymentMethodsImporter: PaymentMethodsImporter,
    private ordersImporter: OrdersImporter,
    private returnsImporter: ReturnsImporter,
  ) {}

  async import(
    data: Buffer,
    filetype: string,
    clear: boolean,
    noImport: boolean,
  ): Promise<ImportStatus> {
    this.idMaps = {};
    let collections: Record<string, Collection> = {};
    if (filetype === 'application/json') {
      collections = await this.jsonSerializer.parse(data);
    } else if (
      filetype === 'application/gzip' ||
      filetype === 'application/x-gzip'
    ) {
      collections = await this.zipSerializer.parse(data);
    }
    const imported: Record<string, number> = {};
    const cleared: Record<string, number> = {};
    const errors: string[] = [];
    checkDataTypeDependencies(Object.keys(collections));
    const keys = dataTypeDependencies
      .map((d) => d[0])
      .filter((k) => k in collections);
    for (const key of [...keys].reverse()) {
      if (!clear || !checkDataType(key)) {
        continue;
      }
      const [deleted, error] = await this.clearCollection(key);
      cleared[key] = deleted;
      if (error) {
        errors.push(error);
      }
    }
    for (const key of keys) {
      if (noImport || !checkDataType(key)) {
        continue;
      }
      const [idMap, error] = await this.importCollection(key, collections[key]);
      this.idMaps[key] = idMap ?? {};
      imported[key] = Object.values(idMap ?? {}).length;
      if (error) {
        errors.push(error);
      }
    }
    return { deleted: cleared, added: imported, errors };
  }

  private async importCollection(type: DataType, data: Collection) {
    let idMap: IdMap | null = null;
    try {
      idMap = await this.importers[type].import(data, this.idMaps);
    } catch (e: any) {
      return [null, e.message] as [null, string];
    }
    return [idMap, null] as [IdMap, null];
  }

  private async clearCollection(type: DataType) {
    try {
      return [await this.importers[type].clear(), null] as [number, null];
    } catch (e: any) {
      return [0, e.message] as [number, string];
    }
  }
}
