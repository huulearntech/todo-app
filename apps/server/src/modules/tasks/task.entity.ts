import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, ManyToMany, JoinTable } from 'typeorm';
import { User } from '../users/user.entity';
import { TaskLabel } from '../task-labels/task-label.entity';
import { Project } from '../projects/project.entity';
import { TaskPriority } from './enums/task-priority.enum';
import { Section } from '../sections/section.entity';


// TODO: Lexorank: Implement Lexorank buckets for task ordering
// NOTE: sections also have lexorank. and at some level, section's lexorank
// acts as a prefix for the task's lexorank.


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

  @Column({ type: 'uuid', name: 'owner_id' })
  ownerId: string;

  @ManyToOne(() => User, user => user.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  // TODO: collaboration between users in projects. Then consider redundancy: project belongs to user
  @Column({ type: 'uuid', name: 'project_id' })
  projectId: string;

  @ManyToOne(() => Project, project => project.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;


  // TODO: This is hella redundant. But for now I'm gonna keep this. @Robustness.
  // The foreign key is either project_id or section_id.
  @Column({ type: 'uuid', name: 'section_id', nullable: true })
  sectionId: string | null;

  @ManyToOne(() => Section, section => section.tasks, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn([
    { name: 'section_id', referencedColumnName: 'id' },
    { name: 'project_id', referencedColumnName: 'projectId' },
  ])
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