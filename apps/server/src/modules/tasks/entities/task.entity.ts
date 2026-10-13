import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { TaskLabel } from '../../task-labels/task-label.entity';
import { Section } from '../../sections/section.entity';

import { TaskPriority } from '@todo/shared';

import { TaskOccurrence } from './task-occurrence.entity';
import { TaskReminder } from './task-reminder.entity';
import { TaskRecurrence } from '../entities/task-recurrence.entity';
import {
  TstzRange,
  TstzRangeTransformer,
} from '../../../common/transformers/tstzrange.transformer';
import { TrigramIndex } from '@/src/common/decorators/trigram-index.decorator';

// TODO: Lexorank: Implement Lexorank reordering cronjob

// TODO: add feature streak of days that meet the goal of completing tasks.

@Entity('tasks')
@Index('tasks_section_lexorank_uq', ['sectionId', 'lexorank'], {
  unique: true,
})
@Index('idx_tasks_completed_at', ['completedAt'])
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @TrigramIndex()
  @Column()
  title: string;

  @CreateDateColumn({ type: 'timestamptz', precision: 3, name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', precision: 3, name: 'updated_at' })
  updatedAt: Date;

  @Column({
    type: 'timestamptz',
    precision: 3,
    name: 'completed_at',
    nullable: true,
  })
  completedAt: Date | null; // NOTE: null for incomplete tasks, timestamptz for completed tasks

  @Index('tasks_time_range_gist_idx', { type: 'gist' })
  @Column({
    type: 'tstzrange',
    name: 'time_range',
    transformer: new TstzRangeTransformer(),
    nullable: true,
  })
  timeRange: TstzRange | null;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ type: 'enum', enum: TaskPriority, default: TaskPriority.HIGH })
  priority: TaskPriority;

  // @Column({ type: 'uuid', name: 'owner_id' })
  // ownerId: string;

  // @ManyToOne(() => User, user => user.id, { onDelete: 'CASCADE' })
  // @JoinColumn({ name: 'owner_id' })
  // owner: User;

  @Column({ type: 'uuid', name: 'section_id' })
  sectionId: string;

  @ManyToOne(() => Section, (section) => section.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'section_id' })
  section: Section;

  @ManyToMany(() => TaskLabel, (taskLabel) => taskLabel.id)
  @JoinTable({
    name: 'task_to_task_labels',
    joinColumn: { name: 'task_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'task_label_id', referencedColumnName: 'id' },
  })
  labels: TaskLabel[];

  // TODO: may factor this out to reuse in sections or other entities.
  @Column({ type: 'varchar', length: 255, nullable: false })
  lexorank: string;

  @OneToMany(() => TaskOccurrence, (occurrence) => occurrence.task)
  occurrences: TaskOccurrence[];

  @OneToOne(() => TaskRecurrence, {
    cascade: ['insert', 'update'],
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'recurrence_id' })
  recurrence: TaskRecurrence | null;

  @OneToMany(() => TaskReminder, (reminder) => reminder.task)
  reminders: TaskReminder[];
}
