import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  registered: Date;

  @Column()
  firstName?: string;

  @Column()
  lastName?: string;

  @PrimaryColumn()
  email: string;

  @Column()
  password: string;
}
