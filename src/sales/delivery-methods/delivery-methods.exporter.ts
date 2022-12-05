import { Injectable } from '@nestjs/common';
import { Exporter } from '../../import-export/models/exporter.interface';
import { DeliveryMethod } from './models/delivery-method.entity';
import { DeliveryMethodsService } from './delivery-methods.service';

@Injectable()
export class DeliveryMethodsExporter implements Exporter<DeliveryMethod> {
  constructor(private deliveryMethodsService: DeliveryMethodsService) {}

  async export(): Promise<DeliveryMethod[]> {
    const deliveryMethods = await this.deliveryMethodsService.getMethods();
    const preparedDeliveryMethods: DeliveryMethod[] = [];
    for (const deliveryMethod of deliveryMethods) {
      preparedDeliveryMethods.push(this.prepareDeliveryMethod(deliveryMethod));
    }
    return preparedDeliveryMethods;
  }

  private prepareDeliveryMethod(deliveryMethod: DeliveryMethod) {
    const preparedDeliveryMethod = new DeliveryMethod();
    preparedDeliveryMethod.id = deliveryMethod.id;
    preparedDeliveryMethod.name = deliveryMethod.name;
    preparedDeliveryMethod.description = deliveryMethod.description;
    preparedDeliveryMethod.price = deliveryMethod.price;
    return preparedDeliveryMethod;
  }
}
