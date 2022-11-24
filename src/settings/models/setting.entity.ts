import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SettingType } from './setting-type.enum';

@Entity('settings')
export class Setting {
  @PrimaryGeneratedColumn()
  id: number;

  @UpdateDateColumn()
  updated: Date;

  @Column()
  builtin: boolean;

  @Index({ unique: true })
  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: SettingType,
    default: SettingType.String,
  })
  type: SettingType;

  @Column()
  defaultValue: string;

  @Column()
  value: string;
}
