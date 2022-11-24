import { Injectable } from '@nestjs/common';
import { PaymentMethod } from './models/payment-method.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PaymentMethodDto } from './dto/payment-method.dto';
import { NotFoundError } from '../../errors/not-found.error';

@Injectable()
export class PaymentMethodsService {
  constructor(
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodsRepository: Repository<PaymentMethod>,
  ) {}

  async getMethods(): Promise<PaymentMethod[]> {
    return this.paymentMethodsRepository.find();
  }

  async getMethod(id: number): Promise<PaymentMethod> {
    const method = await this.paymentMethodsRepository.findOne({
      where: { id },
    });
    if (!method) {
      throw new NotFoundError('payment method', 'id', id.toString());
    }
    return method;
  }

  async createMethod(methodData: PaymentMethodDto): Promise<PaymentMethod> {
    const method = new PaymentMethod();
    method.name = methodData.name;
    method.description = methodData.description;
    method.price = methodData.price;
    return this.paymentMethodsRepository.save(method);
  }

  async updateMethod(
    id: number,
    methodData: PaymentMethodDto,
  ): Promise<PaymentMethod> {
    const method = await this.getMethod(id);
    Object.assign(method, methodData);
    return this.paymentMethodsRepository.save(method);
  }

  async deleteMethod(id: number): Promise<boolean> {
    await this.getMethod(id);
    await this.paymentMethodsRepository.delete({ id });
    return true;
  }
}
