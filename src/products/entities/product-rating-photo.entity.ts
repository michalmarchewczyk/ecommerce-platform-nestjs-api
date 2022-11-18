import { Entity, ManyToOne } from 'typeorm';
import { ProductRating } from './product-rating.entity';
import { Photo } from '../../local-files/entities/photo.entity';

@Entity('product-rating-photos')
export class ProductRatingPhoto extends Photo {
  @ManyToOne(() => ProductRating, (rating) => rating.photos, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  productRating: ProductRating;
}
