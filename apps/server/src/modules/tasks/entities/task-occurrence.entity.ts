import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/database/base.entity';
import { Task } from './task.entity';
import { User } from '../../users/user.entity';
import { TaskOccurrenceStatus } from '@todo/shared';

@Entity('task_occurrences')
@Check(
  'chk_task_occurrences_completed_at',
  "status <> 'completed' OR completed_at IS NOT NULL",
)
@Index('idx_task_occurrences_user_completed_at', ['userId', 'completedAt'])
@Index('idx_task_occurrences_task_id', ['taskId'])
@Index('idx_task_occurrences_task_scheduled', ['taskId', 'scheduledDate'])
@Index('uq_task_occurrences_completed', ['taskId', 'scheduledDate'], {
  unique: true,
  where: "status = 'completed' AND scheduled_date IS NOT NULL",
})
export class TaskOccurrence extends BaseEntity {
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
}
