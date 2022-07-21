import { Injectable } from '@nestjs/common';
import { PaymentMethod } from '../entities/payment-method.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PaymentMethodDto } from '../dto/payment-method.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentMethod)
    private readonly paymentsRepository: Repository<PaymentMethod>,
  ) {}

  async getMethods(): Promise<PaymentMethod[]> {
    return this.paymentsRepository.find();
  }

  async getMethod(id: number): Promise<PaymentMethod | null> {
    const method = await this.paymentsRepository.findOne({ where: { id } });
    if (!method) {
      return null;
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
  ): Promise<PaymentMethod | null> {
    const method = await this.paymentsRepository.findOne({ where: { id } });
    if (!method) {
      return null;
    }
    Object.assign(method, methodData);
    return this.paymentsRepository.save(method);
  }

  async deleteMethod(id: number): Promise<boolean> {
    const method = await this.paymentsRepository.findOne({ where: { id } });
    if (!method) {
      return false;
    }
    await this.paymentsRepository.delete({ id });
    return true;
  }
}
