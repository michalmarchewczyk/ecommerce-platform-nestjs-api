import {
  Column,
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { PaymentMethod } from '../../payment-methods/models/payment-method.entity';

@Entity('order_payments')
export class OrderPayment {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Order, (order) => order.payment, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  order: Order;

  @ManyToOne(() => PaymentMethod, {
    eager: true,
    onDelete: 'SET NULL',
    orphanedRowAction: 'nullify',
  })
  method: PaymentMethod;

  @Column({ default: '' })
  paymentStatus: string;
}
