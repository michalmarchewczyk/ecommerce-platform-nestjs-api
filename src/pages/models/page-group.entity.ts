import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Page } from './page.entity';

@Entity('page_groups')
export class PageGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToMany(() => Page, (page) => page.groups, {
    orphanedRowAction: 'delete',
  })
  pages: Page[];
}
