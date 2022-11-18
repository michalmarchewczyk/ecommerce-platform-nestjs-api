import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Attribute } from './attribute.entity';
import { AttributeValueType } from './attribute-value-type.enum';

@Entity('attribute-types')
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
