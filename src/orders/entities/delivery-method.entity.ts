import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('delivery_methods')
export class DeliveryMethod {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({ type: 'double precision' })
  price: number;
}
