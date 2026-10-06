import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../users/user.entity';
import { Section } from '../sections/section.entity';
import { Color } from '../colors/color.entity';

@Entity('projects')
@Index(['ownerId', 'id'])
@Index(['ownerId', 'name'], { unique: true }) // NOTE: Should this be?
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @CreateDateColumn({ type: 'timestamptz', precision: 3, name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', precision: 3, name: 'updated_at' })
  updatedAt!: Date;

  @Column({ type: 'uuid', name: 'owner_id' })
  ownerId!: string;

  @Column({
    type: 'varchar',
    length: 7,
    name: 'color_hex_code',
    default: '#E0E0E0',
  })
  colorHexCode!: string;

  @ManyToOne(() => User, (user) => user.projects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner!: User;

  @ManyToOne(() => Color, (color) => color.projects, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn([
    { name: 'owner_id', referencedColumnName: 'ownerId' },
    { name: 'color_hex_code', referencedColumnName: 'hexCode' },
  ])
  color!: Color;

  @OneToMany(() => Section, (section) => section.project, { cascade: true })
  sections!: Section[];
}
