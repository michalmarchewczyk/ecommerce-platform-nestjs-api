import { Injectable } from '@nestjs/common';
import { DataType } from './models/data-type.enum';
import { SettingsExporter } from '../settings/settings.exporter';
import { Exporter } from './models/exporter.interface';
import { UsersExporter } from '../users/users.exporter';
import { AttributeTypesExporter } from '../catalog/attribute-types/attribute-types.exporter';
import { GenericError } from '../errors/generic.error';
import { ProductsExporter } from '../catalog/products/products.exporter';
import { JsonSerializer } from './json-serializer.service';
import { ZipSerializer } from './zip-serializer.service';
import { checkDataTypeDependencies } from './data-type.utils';
import { CategoriesExporter } from '../catalog/categories/categories.exporter';
import { WishlistsExporter } from '../wishlists/wishlists.exporter';
import { DeliveryMethodsExporter } from '../sales/delivery-methods/delivery-methods.exporter';
import { PaymentMethodsExporter } from '../sales/payment-methods/payment-methods.exporter';
import { OrdersExporter } from '../sales/orders/orders.exporter';
import { ReturnsExporter } from '../sales/returns/returns.exporter';
import { ProductPhotosExporter } from '../catalog/products/product-photos/product-photos.exporter';
import { PagesExporter } from '../pages/pages.exporter';

@Injectable()
export class ExportService {
  private exporters: Record<string, Exporter<any>> = {
    [DataType.Settings]: this.settingExporter,
    [DataType.Pages]: this.pagesExporter,
    [DataType.Users]: this.usersExporter,
    [DataType.AttributeTypes]: this.attributeTypesExporter,
    [DataType.Products]: this.productsExporter,
    [DataType.ProductPhotos]: this.productPhotosExporter,
    [DataType.Categories]: this.categoriesExporter,
    [DataType.Wishlists]: this.wishlistsExporter,
    [DataType.DeliveryMethods]: this.deliveryMethodsExporter,
    [DataType.PaymentMethods]: this.paymentMethodsExporter,
    [DataType.Orders]: this.ordersExporter,
    [DataType.Returns]: this.returnsExporter,
  };

  constructor(
    private jsonSerializer: JsonSerializer,
    private zipSerializer: ZipSerializer,
    private settingExporter: SettingsExporter,
    private pagesExporter: PagesExporter,
    private usersExporter: UsersExporter,
    private attributeTypesExporter: AttributeTypesExporter,
    private productsExporter: ProductsExporter,
    private productPhotosExporter: ProductPhotosExporter,
    private categoriesExporter: CategoriesExporter,
    private wishlistsExporter: WishlistsExporter,
    private deliveryMethodsExporter: DeliveryMethodsExporter,
    private paymentMethodsExporter: PaymentMethodsExporter,
    private ordersExporter: OrdersExporter,
    private returnsExporter: ReturnsExporter,
  ) {}

  getFilename(format: 'json' | 'csv') {
    const ext = format === 'csv' ? 'tar.gz' : 'json';
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `export_${year}${month}${day}_${hours}${minutes}${seconds}.${ext}`;
  }

  async export(data: DataType[], format: 'json' | 'csv') {
    checkDataTypeDependencies(data);
    const toExport: Record<string, any[]> = {};
    for (const key of data) {
      toExport[key] = await this.exportCollection(key);
    }
    if (format === 'json') {
      if (data.includes(DataType.ProductPhotos)) {
        throw new GenericError('Cannot export product photos in JSON format');
      }
      return await this.jsonSerializer.serialize(toExport);
    } else if (format === 'csv') {
      const photoPaths = data.includes(DataType.ProductPhotos)
        ? toExport[DataType.ProductPhotos].map((photo) => photo.path)
        : undefined;
      return await this.zipSerializer.serialize(toExport, photoPaths);
    } else {
      throw new GenericError('could not serialize export output');
    }
  }

  private async exportCollection(type: DataType) {
    return await this.exporters[type].export();
  }
}
