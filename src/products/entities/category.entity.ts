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

  @Column()
  slug: string;

  @ManyToOne(() => Category, (category) => category.childCategories, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  parentCategory?: Category;

  @OneToMany(() => Category, (category) => category.parentCategory, {
    onDelete: 'SET NULL',
  })
  childCategories: Category[];

  @ManyToMany(() => Product)
  @JoinTable()
  products: Product[];
}
