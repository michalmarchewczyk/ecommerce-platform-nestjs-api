import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Attribute } from './attribute.entity';

export enum AttributeValueType {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Color = 'color',
}

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
