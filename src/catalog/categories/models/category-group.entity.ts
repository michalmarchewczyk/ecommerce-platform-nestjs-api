import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Category } from './category.entity';

@Entity('category_groups')
export class CategoryGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToMany(() => Category, (category) => category.groups, {
    orphanedRowAction: 'delete',
  })
  categories: Category[];
}
