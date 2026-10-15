import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToMany,
  ManyToOne,
} from 'typeorm';
import { BaseEntity } from '../../common/database/base.entity';
import { Task } from '../tasks/entities/task.entity';
import { User } from '../users/user.entity';
import { TrigramIndex } from '@/src/common/decorators/trigram-index.decorator';

@Entity('task_labels')
@Index(['name', 'ownerId'], { unique: true }) // NOTE: This ensures that a user cannot create two labels with the same name.
export class TaskLabel extends BaseEntity {
  @TrigramIndex()
  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToMany(() => Task, (task) => task.labels)
  tasks!: Task[];

  @Column({ type: 'uuid', name: 'owner_id' })
  ownerId!: string;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'color_key',
    default: 'slate',
  })
  colorKey!: string;

  @ManyToOne(() => User, (owner) => owner.taskLabels, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner!: User;
}
