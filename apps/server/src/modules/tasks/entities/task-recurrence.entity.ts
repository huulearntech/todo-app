import { Entity, Column, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../common/database/base.entity';
import { Task } from '../entities/task.entity';
import { RecurrenceTransformer } from '@/src/common/transformers/recurrence.transformer';
import { type RRule } from '@todo/shared';

@Entity('task_recurrences')
export class TaskRecurrence extends BaseEntity {
  @OneToOne(() => Task, (task) => task.recurrence)
  task: Task;

  @Column({
    type: 'text',
    name: 'rrule',
    transformer: new RecurrenceTransformer(),
    nullable: true,
  })
  rrule: RRule | null;

  // TODO: this should not be here.
  // The time range of the task should still live in the task table.
  @Column({ type: 'timestamp', nullable: true })
  startsAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  endsAt: Date | null;

  @Column({ length: 64 })
  timezone: string;
}
