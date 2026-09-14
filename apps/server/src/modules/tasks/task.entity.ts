import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, ManyToMany, JoinTable } from 'typeorm';
import { User } from '../users/user.entity';
import { TaskLabel } from '../task-labels/task-label.entity';
import { Project } from '../projects/project.entity';
import { TaskPriority } from './enums/task-priority.enum';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index('idx_task_title_trgm', { synchronize: false })
  @Column()
  title!: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date; // NOTE: null (DB) for incomplete tasks, timestamp for completed tasks

  @Column({ type: 'timestamp', nullable: true })
  dueDate?: Date;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: TaskPriority, default: TaskPriority.MEDIUM })
  priority!: TaskPriority;

  @Column({ type: 'text', nullable: true })
  category?: string;

  @Column({ type: 'uuid', name: 'owner_id' })
  ownerId!: string;

  @ManyToOne(() => User, user => user.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner!: User;

  @Column({ type: 'uuid', name: 'project_id' }) // FIX: redundancy: project belongs to user
  projectId!: string;

  @ManyToOne(() => Project, project => project.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project!: Project;


  @ManyToMany(() => TaskLabel, (taskLabel) => taskLabel.id)
  @JoinTable({
    name: 'task_to_task_labels',
    joinColumn: { name: 'task_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'task_label_id', referencedColumnName: 'id' }
  })
  labels!: TaskLabel[];
}