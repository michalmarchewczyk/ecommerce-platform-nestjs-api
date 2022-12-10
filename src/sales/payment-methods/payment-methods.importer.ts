import { Injectable } from '@nestjs/common';
import { Importer } from '../../import-export/models/importer.interface';
import { Collection } from '../../import-export/models/collection.type';
import { ParseError } from '../../errors/parse.error';
import { IdMap } from '../../import-export/models/id-map.type';
import { PaymentMethodsService } from './payment-methods.service';
import { PaymentMethod } from './models/payment-method.entity';

@Injectable()
export class PaymentMethodsImporter implements Importer {
  constructor(private paymentMethodsService: PaymentMethodsService) {}

  async import(paymentMethods: Collection): Promise<IdMap> {
    const parsedPaymentMethods = this.parsePaymentMethods(paymentMethods);
    const idMap: IdMap = {};
    for (const paymentMethod of parsedPaymentMethods) {
      const { id, ...createDto } = paymentMethod;
      const { id: newId } = await this.paymentMethodsService.createMethod(
        createDto,
      );
      idMap[paymentMethod.id] = newId;
    }
    return idMap;
  }

  async clear() {
    const paymentMethods = await this.paymentMethodsService.getMethods();
    let deleted = 0;
    for (const paymentMethod of paymentMethods) {
      await this.paymentMethodsService.deleteMethod(paymentMethod.id);
      deleted += 1;
    }
    return deleted;
  }

  private parsePaymentMethods(paymentMethods: Collection) {
    const parsedPaymentMethods: PaymentMethod[] = [];
    for (const paymentMethod of paymentMethods) {
      parsedPaymentMethods.push(this.parsePaymentMethod(paymentMethod));
    }
    return parsedPaymentMethods;
  }

  private parsePaymentMethod(paymentMethod: Collection[number]) {
    const parsedPaymentMethod = new PaymentMethod();
    try {
      parsedPaymentMethod.id = paymentMethod.id as number;
      parsedPaymentMethod.name = paymentMethod.name as string;
      parsedPaymentMethod.description = paymentMethod.description as string;
      parsedPaymentMethod.price = paymentMethod.price as number;
    } catch (e) {
      throw new ParseError('paymentMethod');
    }
    return parsedPaymentMethod;
  }
}
