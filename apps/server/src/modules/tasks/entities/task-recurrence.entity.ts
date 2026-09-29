import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne } from 'typeorm';
import { Task } from '../entities/task.entity';

@Entity('task_recurrences')
export class TaskRecurrence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  taskId: string;

  @OneToOne(() => Task, task => task.recurrence)
  task: Task;

  @Column({ type: 'text', name: 'rrule_string', nullable: true })
  rruleString: string | null;

  @Column({ type: 'timestamp without time zone', nullable: true })
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
