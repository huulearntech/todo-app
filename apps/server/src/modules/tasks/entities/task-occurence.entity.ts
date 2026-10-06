import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Task } from '../entities/task.entity';
import {
  type TstzRange,
  TstzRangeTransformer,
} from '@/src/common/transformers/tstzrange.transformer';
import { TaskOccurenceStatus } from '@todo/shared';

@Entity('task_occurences')
export class TaskOccurence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Task, (task) => task.occurences, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Column({ type: 'uuid', name: 'task_id' })
  taskId: string;

  @Column({
    type: 'tstzrange',
    name: 'time_range',
    transformer: new TstzRangeTransformer(),
    nullable: true,
  })
  timeRange: TstzRange | null;

  @Column({
    type: 'enum',
    enum: TaskOccurenceStatus,
    default: TaskOccurenceStatus.PENDING,
  })
  status: TaskOccurenceStatus;
}
