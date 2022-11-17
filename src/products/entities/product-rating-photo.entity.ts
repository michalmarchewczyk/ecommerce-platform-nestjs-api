import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ProductRating } from './product-rating.entity';

@Entity('product-rating-photos')
export class ProductRatingPhoto {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ProductRating, (rating) => rating.photos, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  productRating: ProductRating;

  @Column()
  path: string;

  @Column()
  mimeType: string;

  @Column()
  thumbnailPath: string;
}
