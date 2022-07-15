import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({ nullable: true })
  slug?: string;

  @ManyToOne(() => Category, (category) => category.childCategories, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  parentCategory?: Category;

  @OneToMany(() => Category, (category) => category.parentCategory, {
    onDelete: 'SET NULL',
  })
  childCategories: Category[];

  @ManyToMany(() => Product, {
    onDelete: 'CASCADE',
  })
  @JoinTable()
  products: Product[];
}
