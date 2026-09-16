// NOTE: think about the unique constraint on default project to user? How it relates to this default section to project?

import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';

import { Task } from '../tasks/task.entity';
import { Project } from '../projects/project.entity';

@Entity('sections')
@Unique(['id', 'projectId'])
@Index(['projectId', 'name'], { unique: true }) // Ensure that each project can only have one section with a given name
export class Section {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'project_id' }) // NOTE: This is the ID of the project to which this section belongs
  projectId!: string;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP'
  })
  createdAt!: Date;

  @Column({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP'
  })
  updatedAt!: Date;

  @ManyToOne(() => Project, project => project.sections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @OneToMany(() => Task, task => task.project, { cascade: true })
  tasks!: Task[];

  // TODO: need to factor this out
  @Index()
  @Column({ type: 'varchar', length: 255, nullable: false })
  lexorank: string;
}