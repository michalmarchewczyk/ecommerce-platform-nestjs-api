import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Attribute } from '../../products/models/attribute.entity';
import { AttributeValueType } from './attribute-value-type.enum';

@Entity('attribute_types')
export class AttributeType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: AttributeValueType,
    default: AttributeValueType.String,
  })
  valueType: AttributeValueType;

  @OneToMany(() => Attribute, (attribute) => attribute.type, {
    onDelete: 'CASCADE',
  })
  attributes: Attribute[];
}
