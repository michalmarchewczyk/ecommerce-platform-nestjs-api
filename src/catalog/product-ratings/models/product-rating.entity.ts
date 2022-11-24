import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../../products/models/product.entity';
import { User } from '../../../users/models/user.entity';
import { ProductRatingPhoto } from '../product-rating-photos/models/product-rating-photo.entity';

@Entity('product_ratings')
export class ProductRating {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Product, (product) => product.ratings, {
    orphanedRowAction: 'delete',
  })
  product: Product;

  @Column()
  rating: number;

  @Column({ nullable: true })
  comment?: string;

  @OneToMany(() => ProductRatingPhoto, (photo) => photo.productRating, {
    eager: true,
    onDelete: 'CASCADE',
    cascade: true,
  })
  photos: ProductRatingPhoto[];
}
