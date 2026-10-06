import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Task } from '../tasks/entities/task.entity';
import { User } from '../users/user.entity';
import { Color } from '../colors/color.entity';

@Entity('task_labels')
@Index(['name', 'ownerId'], { unique: true }) // NOTE: This ensures that a user cannot create two labels with the same name.
export class TaskLabel {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToMany(() => Task, (task) => task.labels)
  tasks!: Task[];

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

  @ManyToOne(() => User, (owner) => owner.taskLabels, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner!: User;

  @ManyToOne(() => Color, (color) => color.taskLabels, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn([
    { name: 'owner_id', referencedColumnName: 'ownerId' },
    { name: 'color_hex_code', referencedColumnName: 'hexCode' },
  ])
  color!: Color;
}
