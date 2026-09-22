import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, ManyToMany, JoinTable, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { TaskLabel } from '../task-labels/task-label.entity';
import { Project } from '../projects/project.entity';
import { Section } from '../sections/section.entity';

import { TaskPriority } from "@todo/shared";


// TODO: Lexorank: Implement Lexorank reordering cronjob

// TODO: add feature streak of days that meet the goal of completing tasks. This is a good feature to motivate users to complete tasks and use the app more often. It can be implemented by adding a new column to the task table that stores the date of the last completed task. Then, we can calculate the streak by comparing the current date with the last completed task date. If the difference is 1 day, we increment the streak. If it's more than 1 day, we reset the streak to 0. We can also add a new table to store the streak history for each user.

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_task_title_trgm', { synchronize: false })
  @Column()
  title: string;

  @CreateDateColumn({ type: 'timestamptz', precision: 3, name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', precision: 3, name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'timestamptz', precision: 3, name: 'completed_at', nullable: true })
  completedAt: Date | null; // NOTE: null for incomplete tasks, timestamptz for completed tasks

  @Column({ type: 'timestamptz', precision: 3, name: 'started_at', default: () => 'CURRENT_TIMESTAMP' })
  startedAt: Date;

  @Column({ type: 'timestamptz', precision: 3, name: 'due_at', nullable: true })
  dueAt: Date | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: TaskPriority, default: TaskPriority.HIGH })
  priority: TaskPriority;

  // @Column({ type: 'uuid', name: 'owner_id' })
  // ownerId: string;

  // @ManyToOne(() => User, user => user.id, { onDelete: 'CASCADE' })
  // @JoinColumn({ name: 'owner_id' })
  // owner: User;

  @Column({ type: 'uuid', name: 'section_id' })
  sectionId: string;

  @ManyToOne(() => Section, section => section.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'section_id' })
  section: Section;


  @ManyToMany(() => TaskLabel, (taskLabel) => taskLabel.id)
  @JoinTable({
    name: 'task_to_task_labels',
    joinColumn: { name: 'task_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'task_label_id', referencedColumnName: 'id' }
  })
  labels: TaskLabel[];

  // TODO: may factor this out to reuse in sections or other entities.
  @Index()
  @Column({ type: 'varchar', length: 255, nullable: false })
  lexorank: string;
}