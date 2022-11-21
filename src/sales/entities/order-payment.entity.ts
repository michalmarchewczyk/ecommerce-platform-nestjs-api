import {
  Column,
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { PaymentMethod } from './payment-method.entity';

@Entity('order_payments')
export class OrderPayment {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Order, (order) => order.payment, {
    orphanedRowAction: 'delete',
  })
  order: Order;

  @ManyToOne(() => PaymentMethod, {
    eager: true,
  })
  method: PaymentMethod;

  @Column({ default: '' })
  paymentStatus: string;
}
