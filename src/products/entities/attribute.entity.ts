import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AttributeType } from './attribute-type.entity';
import { Product } from './product.entity';

@Entity('attributes')
export class Attribute {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Product, (product) => product.attributes)
  product: Product;

  @Column()
  value: string;

  @ManyToOne(() => AttributeType, (attributeType) => attributeType.attributes, {
    eager: true,
  })
  type: AttributeType;
}
