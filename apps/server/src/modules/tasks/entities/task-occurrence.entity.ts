import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Task } from './task.entity';
import { User } from '../../users/user.entity';
import { TaskOccurrenceStatus } from '@todo/shared';

@Entity('task_occurrences')
@Index('idx_task_occurrences_user_completed_at', ['userId', 'completedAt'])
@Index('idx_task_occurrences_task_id', ['taskId'])
@Index('idx_task_occurrences_task_scheduled', ['taskId', 'scheduledDate'])
export class TaskOccurrence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'task_id' })
  taskId: string;

  @ManyToOne(() => Task, (task) => task.occurrences, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'timestamptz',
    precision: 3,
    name: 'scheduled_date',
    nullable: true,
  })
  scheduledDate: Date | null;

  @Column({
    type: 'enum',
    enum: TaskOccurrenceStatus,
    default: TaskOccurrenceStatus.PENDING,
  })
  status: TaskOccurrenceStatus;

  @Column({
    type: 'timestamptz',
    precision: 3,
    name: 'completed_at',
    nullable: true,
  })
  completedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz', precision: 3, name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', precision: 3, name: 'updated_at' })
  updatedAt: Date;
}
