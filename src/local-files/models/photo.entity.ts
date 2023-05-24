import { Column, PrimaryGeneratedColumn } from 'typeorm';

export abstract class Photo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  path: string;

  @Column()
  mimeType: string;

  @Column()
  thumbnailPath: string;

  @Column({ nullable: true })
  placeholderBase64: string;
}
