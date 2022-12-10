import { DataType } from './data-type.enum';

const dataTypeDependencies: [DataType, DataType[]][] = [
  [DataType.Settings, []],
  [DataType.Pages, []],
  [DataType.Users, []],
  [DataType.AttributeTypes, []],
  [DataType.Products, [DataType.AttributeTypes]],
  [DataType.ProductPhotos, [DataType.Products]],
  [DataType.Categories, [DataType.Products]],
  [DataType.Wishlists, [DataType.Users, DataType.Products]],
  [DataType.DeliveryMethods, []],
  [DataType.PaymentMethods, []],
  [
    DataType.Orders,
    [
      DataType.Users,
      DataType.Products,
      DataType.DeliveryMethods,
      DataType.PaymentMethods,
    ],
  ],
  [DataType.Returns, [DataType.Orders]],
];

export { dataTypeDependencies };
