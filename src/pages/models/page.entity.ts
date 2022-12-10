import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PageGroup } from './page-group.entity';

@Entity('pages')
export class Page {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;

  @Column()
  title: string;

  @Column({ nullable: true })
  slug: string;

  @Column()
  content: string;

  @ManyToMany(() => PageGroup, (pageGroup) => pageGroup.pages, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinTable()
  groups: PageGroup[];
}
