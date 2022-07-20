import {
  Column,
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { DeliveryMethod } from './delivery-method.entity';

@Entity('order_deliveries')
export class OrderDelivery {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Order, (order) => order.delivery)
  order: Order;

  @ManyToOne(() => DeliveryMethod, {
    eager: true,
  })
  method: DeliveryMethod;

  @Column()
  deliveryStatus: string;
}
