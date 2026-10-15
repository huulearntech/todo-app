import {
  Entity,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';

import { BaseEntity } from '../../common/database/base.entity';
import { Task } from '../tasks/entities/task.entity';
import { Project } from '../projects/project.entity';
import { User } from '../users/user.entity';

@Entity('sections')
@Unique(['id', 'projectId'])
@Index(['projectId', 'name'], { unique: true }) // Ensure that each project can only have one section with a given name
export class Section extends BaseEntity {
  @Column({ type: 'uuid', name: 'project_id' })
  projectId: string;

  @Column({ type: 'uuid', name: 'owner_id' })
  ownerId!: string;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'color_key',
    nullable: true,
    default: null,
  })
  colorKey?: string | null;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ManyToOne(() => User, (user) => user.sections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner!: User;

  @ManyToOne(() => Project, (project) => project.sections, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @OneToMany(() => Task, (task) => task.section, { cascade: true })
  tasks: Task[];

  // TODO: need to factor this out
  @Index()
  @Column({ type: 'varchar', length: 255, collation: 'C', nullable: false })
  lexorank: string;
}
