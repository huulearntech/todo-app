import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, ManyToMany, JoinTable } from 'typeorm';
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

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null; // NOTE: null (DB) for incomplete tasks, timestamp for completed tasks

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: TaskPriority, default: TaskPriority.HIGH })
  priority: TaskPriority;

  @Column({ type: 'text', nullable: true })
  category: string | null;


  // TODO: may have creatorId in the future

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