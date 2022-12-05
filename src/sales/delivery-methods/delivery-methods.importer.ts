import { Injectable } from '@nestjs/common';
import { Importer } from '../../import-export/models/importer.interface';
import { Collection } from '../../import-export/models/collection.type';
import { ParseError } from '../../errors/parse.error';
import { IdMap } from '../../import-export/models/id-map.type';
import { DeliveryMethodsService } from './delivery-methods.service';
import { DeliveryMethod } from './models/delivery-method.entity';

@Injectable()
export class DeliveryMethodsImporter implements Importer {
  constructor(private deliveryMethodsService: DeliveryMethodsService) {}

  async import(deliveryMethods: Collection): Promise<IdMap> {
    const parsedDeliveryMethods = this.parseDeliveryMethods(deliveryMethods);
    const idMap: IdMap = {};
    for (const deliveryMethod of parsedDeliveryMethods) {
      const { id, ...createDto } = deliveryMethod;
      const { id: newId } = await this.deliveryMethodsService.createMethod(
        createDto,
      );
      idMap[deliveryMethod.id] = newId;
    }
    return idMap;
  }

  async clear() {
    const deliveryMethods = await this.deliveryMethodsService.getMethods();
    let deleted = 0;
    for (const deliveryMethod of deliveryMethods) {
      await this.deliveryMethodsService.deleteMethod(deliveryMethod.id);
      deleted += 1;
    }
    return deleted;
  }

  private parseDeliveryMethods(deliveryMethods: Collection) {
    const parsedDeliveryMethods: DeliveryMethod[] = [];
    for (const deliveryMethod of deliveryMethods) {
      parsedDeliveryMethods.push(this.parseDeliveryMethod(deliveryMethod));
    }
    return parsedDeliveryMethods;
  }

  private parseDeliveryMethod(deliveryMethod: Collection[number]) {
    const parsedDeliveryMethod = new DeliveryMethod();
    try {
      parsedDeliveryMethod.id = deliveryMethod.id as number;
      parsedDeliveryMethod.name = deliveryMethod.name as string;
      parsedDeliveryMethod.description = deliveryMethod.description as string;
      parsedDeliveryMethod.price = deliveryMethod.price as number;
    } catch (e) {
      throw new ParseError('deliveryMethod');
    }
    return parsedDeliveryMethod;
  }
}
