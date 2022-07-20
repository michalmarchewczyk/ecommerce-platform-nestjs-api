import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DeliveryMethod } from '../entities/delivery-method.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DeliveryMethodDto } from '../dto/delivery-method.dto';

@Injectable()
export class DeliveriesService {
  constructor(
    @InjectRepository(DeliveryMethod)
    private readonly deliveriesRepository: Repository<DeliveryMethod>,
  ) {}

  async getMethods(): Promise<DeliveryMethod[]> {
    return this.deliveriesRepository.find();
  }

  async getMethod(id: number): Promise<DeliveryMethod | null> {
    const method = await this.deliveriesRepository.findOne({ where: { id } });
    if (!method) {
      return null;
    }
    return method;
  }

  async createMethod(methodData: DeliveryMethodDto): Promise<DeliveryMethod> {
    const method = new DeliveryMethod();
    method.name = methodData.name;
    method.description = methodData.description;
    method.price = methodData.price;
    return this.deliveriesRepository.save(method);
  }

  async updateMethod(
    id: number,
    methodData: DeliveryMethodDto,
  ): Promise<DeliveryMethod | null> {
    const method = await this.deliveriesRepository.findOne({ where: { id } });
    if (!method) {
      return null;
    }
    method.name = methodData.name;
    method.description = methodData.description;
    method.price = methodData.price;
    return this.deliveriesRepository.save(method);
  }

  async deleteMethod(id: number): Promise<boolean> {
    const method = await this.deliveriesRepository.findOne({ where: { id } });
    if (!method) {
      return false;
    }
    await this.deliveriesRepository.delete({ id });
    return true;
  }
}
