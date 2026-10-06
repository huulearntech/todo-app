import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { Task } from '../entities/task.entity';
import { RecurrenceTransformer } from '@/src/common/transformers/rrule_plpgsql.transformer';
import { RRule } from 'rrule';

@Entity('task_recurrences')
export class TaskRecurrence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
