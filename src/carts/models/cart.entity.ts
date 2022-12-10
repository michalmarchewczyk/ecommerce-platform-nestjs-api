import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/models/user.entity';
import { Product } from '../../catalog/products/models/product.entity';

@Entity('carts')
export class Cart {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, { nullable: true, orphanedRowAction: 'delete' })
  @JoinColumn()
  user?: User;

  @Column({ nullable: true })
  sessionId?: string;

  @ManyToMany(() => Product, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinTable()
  products: Product[];
}
