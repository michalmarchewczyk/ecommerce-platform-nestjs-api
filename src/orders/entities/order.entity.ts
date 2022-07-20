import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { OrderStatus } from './order-status.enum';
import { OrderItem } from './order-item.entity';
import { OrderDelivery } from './order-delivery.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;

  @ManyToOne(() => User, {
    nullable: true,
  })
  user?: User;

  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
  })
  items: OrderItem[];

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.Pending,
  })
  status: OrderStatus;

  @OneToOne(() => OrderDelivery, (delivery) => delivery.order, {
    cascade: true,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  delivery: OrderDelivery;

  @Column()
  fullName: string;

  @Column()
  contactEmail: string;

  @Column()
  contactPhone: string;

  @Column({ nullable: true })
  message?: string;
}
