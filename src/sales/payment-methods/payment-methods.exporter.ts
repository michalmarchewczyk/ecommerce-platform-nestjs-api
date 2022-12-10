import { Injectable } from '@nestjs/common';
import { Exporter } from '../../import-export/models/exporter.interface';
import { PaymentMethod } from './models/payment-method.entity';
import { PaymentMethodsService } from './payment-methods.service';

@Injectable()
export class PaymentMethodsExporter implements Exporter<PaymentMethod> {
  constructor(private paymentMethodsService: PaymentMethodsService) {}

  async export(): Promise<PaymentMethod[]> {
    const paymentMethods = await this.paymentMethodsService.getMethods();
    const preparedPaymentMethods: PaymentMethod[] = [];
    for (const paymentMethod of paymentMethods) {
      preparedPaymentMethods.push(this.preparePaymentMethod(paymentMethod));
    }
    return preparedPaymentMethods;
  }

  private preparePaymentMethod(paymentMethod: PaymentMethod) {
    const preparedPaymentMethod = new PaymentMethod();
    preparedPaymentMethod.id = paymentMethod.id;
    preparedPaymentMethod.name = paymentMethod.name;
    preparedPaymentMethod.description = paymentMethod.description;
    preparedPaymentMethod.price = paymentMethod.price;
    return preparedPaymentMethod;
  }
}
