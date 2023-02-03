import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Attribute } from './attribute.entity';
import { ProductPhoto } from '../product-photos/models/product-photo.entity';
import { ProductRating } from '../../product-ratings/models/product-rating.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;

  @Column()
  name: string;

  @Column({ type: 'double precision' })
  price: number;

  @Column({ default: true })
  visible: boolean;

  @Column()
  description: string;

  @Column()
  stock: number;

  @OneToMany(() => Attribute, (attribute) => attribute.product, {
    eager: true,
    onDelete: 'CASCADE',
    cascade: true,
  })
  attributes: Attribute[];

  @OneToMany(() => ProductPhoto, (photo) => photo.product, {
    eager: true,
    onDelete: 'CASCADE',
    cascade: true,
  })
  photos: ProductPhoto[];

  @Column({ default: '' })
  photosOrder: string;

  @OneToMany(() => ProductRating, (rating) => rating.product, {
    onDelete: 'CASCADE',
    cascade: true,
  })
  ratings: ProductRating[];
}
