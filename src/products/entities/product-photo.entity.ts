import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity('product-photos')
export class ProductPhoto {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Product, (product) => product.photos, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  product: Product;

  @Column()
  path: string;

  @Column()
  mimeType: string;
}
