import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DeliveryMethod } from './models/delivery-method.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DeliveryMethodDto } from './dto/delivery-method.dto';
import { NotFoundError } from '../../errors/not-found.error';

@Injectable()
export class DeliveryMethodsService {
  constructor(
    @InjectRepository(DeliveryMethod)
    private readonly deliveryMethodsRepository: Repository<DeliveryMethod>,
  ) {}

  async getMethods(): Promise<DeliveryMethod[]> {
    return this.deliveryMethodsRepository.find();
  }

  async getMethod(id: number): Promise<DeliveryMethod> {
    const method = await this.deliveryMethodsRepository.findOne({
      where: { id },
    });
    if (!method) {
      throw new NotFoundError('delivery method', 'id', id.toString());
    }
    return method;
  }

  async createMethod(methodData: DeliveryMethodDto): Promise<DeliveryMethod> {
    const method = new DeliveryMethod();
    method.name = methodData.name;
    method.description = methodData.description;
    method.price = methodData.price;
    return this.deliveryMethodsRepository.save(method);
  }

  async updateMethod(
    id: number,
    methodData: DeliveryMethodDto,
  ): Promise<DeliveryMethod> {
    const method = await this.getMethod(id);
    method.name = methodData.name;
    method.description = methodData.description;
    method.price = methodData.price;
    return this.deliveryMethodsRepository.save(method);
  }

  async deleteMethod(id: number): Promise<boolean> {
    await this.getMethod(id);
    await this.deliveryMethodsRepository.delete({ id });
    return true;
  }
}
