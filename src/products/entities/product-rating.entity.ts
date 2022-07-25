import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('product-ratings')
export class ProductRating {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;

  @ManyToOne(() => Product, (product) => product.ratings, {
    orphanedRowAction: 'delete',
  })
  product: Product;

  @Column()
  rating: number;

  @Column({ nullable: true })
  comment?: string;
}
