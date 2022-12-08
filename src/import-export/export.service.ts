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

@Injectable()
export class ExportService {
  private exporters: Record<string, Exporter<any>> = {
    [DataType.Settings]: this.settingExporter,
    [DataType.Users]: this.usersExporter,
    [DataType.AttributeTypes]: this.attributeTypesExporter,
    [DataType.Products]: this.productsExporter,
    [DataType.Categories]: this.categoriesExporter,
    [DataType.Wishlists]: this.wishlistsExporter,
    [DataType.DeliveryMethods]: this.deliveryMethodsExporter,
    [DataType.PaymentMethods]: this.paymentMethodsExporter,
    [DataType.Orders]: this.ordersExporter,
  };

  constructor(
    private jsonSerializer: JsonSerializer,
    private zipSerializer: ZipSerializer,
    private settingExporter: SettingsExporter,
    private usersExporter: UsersExporter,
    private attributeTypesExporter: AttributeTypesExporter,
    private productsExporter: ProductsExporter,
    private categoriesExporter: CategoriesExporter,
    private wishlistsExporter: WishlistsExporter,
    private deliveryMethodsExporter: DeliveryMethodsExporter,
    private paymentMethodsExporter: PaymentMethodsExporter,
    private ordersExporter: OrdersExporter,
  ) {}

  async export(data: DataType[], format: 'json' | 'csv') {
    checkDataTypeDependencies(data);
    const toExport: Record<string, any[]> = {};
    for (const key of data) {
      toExport[key] = await this.exportCollection(key);
    }
    if (format === 'json') {
      return await this.jsonSerializer.serialize(toExport);
    } else if (format === 'csv') {
      return await this.zipSerializer.serialize(toExport);
    } else {
      throw new GenericError('could not serialize export output');
    }
  }

  private async exportCollection(type: DataType) {
    return await this.exporters[type].export();
  }
}
