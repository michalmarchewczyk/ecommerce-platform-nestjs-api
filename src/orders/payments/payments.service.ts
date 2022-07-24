import { Injectable } from '@nestjs/common';
import { PaymentMethod } from '../entities/payment-method.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PaymentMethodDto } from '../dto/payment-method.dto';
import { NotFoundError } from '../../errors/not-found.error';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentMethod)
    private readonly paymentsRepository: Repository<PaymentMethod>,
  ) {}

  async getMethods(): Promise<PaymentMethod[]> {
    return this.paymentsRepository.find();
  }

  async getMethod(id: number): Promise<PaymentMethod> {
    const method = await this.paymentsRepository.findOne({ where: { id } });
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
    return this.paymentsRepository.save(method);
  }

  async updateMethod(
    id: number,
    methodData: PaymentMethodDto,
  ): Promise<PaymentMethod> {
    const method = await this.paymentsRepository.findOne({ where: { id } });
    if (!method) {
      throw new NotFoundError('payment method', 'id', id.toString());
    }
    Object.assign(method, methodData);
    return this.paymentsRepository.save(method);
  }

  async deleteMethod(id: number): Promise<boolean> {
    const method = await this.paymentsRepository.findOne({ where: { id } });
    if (!method) {
      throw new NotFoundError('payment method', 'id', id.toString());
    }
    await this.paymentsRepository.delete({ id });
    return true;
  }
}
