import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { ReturnStatus } from './return-status.enum';

@Entity('returns')
export class Return {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;

  @OneToOne(() => Order)
  @JoinColumn()
  order: Order;

  @Column()
  message: string;

  @Column({
    type: 'enum',
    enum: ReturnStatus,
    default: ReturnStatus.Open,
  })
  status: ReturnStatus;
}
