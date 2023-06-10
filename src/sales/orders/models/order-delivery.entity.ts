import {
  Column,
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { DeliveryMethod } from '../../delivery-methods/models/delivery-method.entity';

@Entity('order_deliveries')
export class OrderDelivery {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Order, (order) => order.delivery, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  order: Order;

  @ManyToOne(() => DeliveryMethod, {
    eager: true,
    onDelete: 'SET NULL',
    orphanedRowAction: 'nullify',
  })
  method: DeliveryMethod;

  @Column({ default: '' })
  deliveryStatus: string;

  @Column()
  address: string;

  @Column()
  city: string;

  @Column({ nullable: true })
  postalCode?: string;

  @Column()
  country: string;
}
