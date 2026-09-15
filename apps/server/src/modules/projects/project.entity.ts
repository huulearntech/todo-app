import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn, Index } from 'typeorm';

import { Task } from '../tasks/task.entity';
import { User } from '../users/user.entity';
import { Section } from '../sections/section.entity';

@Entity('projects')
@Index(['ownerId', 'id'])
@Index(['ownerId', 'title'], { unique: true }) // Ensure that each user can only have one project with a given title
@Index(['ownerId', 'isDefault'], { unique: true, where: '"is_default" = true' }) // Ensure that each user can only have one default project
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

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

  @Column({ type: 'uuid', name: 'owner_id' }) // NOTE: This is the ID of the owner who created the project. How to name it?
  ownerId!: string;

  @ManyToOne(() => User, user => user.projects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner!: User;

  @OneToMany(() => Task, task => task.project, { cascade: true })
  tasks!: Task[];

  @OneToMany(() => Section, section => section.project, { cascade: true })
  sections!: Section[];


  @Column({ type: 'boolean', name: 'is_default', default: false })
  isDefault!: boolean; // Indicates whether this project is a default project (e.g., Inbox, Today, Upcoming)
}