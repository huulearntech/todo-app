import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/database/base.entity';
import { Task } from './task.entity';
import { User } from '../../users/user.entity';

@Entity('task_reminders')
@Index('idx_task_reminders_task_id', ['taskId'])
@Index('idx_task_reminders_user_id', ['userId'])
export class TaskReminder extends BaseEntity {
  @Column({ type: 'uuid', name: 'task_id' })
  taskId: string;

  @ManyToOne(() => Task, (task) => task.reminders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'varchar',
    length: 32,
    default: 'relative',
  })
  type: 'relative' | 'absolute';

  @Column({ type: 'int', name: 'minute_offset', nullable: true, default: 30 })
  minuteOffset: number | null;

  @Column({
    type: 'timestamptz',
    precision: 3,
    name: 'remind_at',
    nullable: true,
  })
  remindAt: Date | null;

  @Column({
    type: 'varchar',
    length: 32,
    default: 'email',
  })
  channel: 'email';
}
