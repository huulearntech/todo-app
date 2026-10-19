import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/database/base.entity';
import { Project } from '../project.entity';
import { User } from '../../users/user.entity';
import { ProjectRole } from '@todo/shared';

@Entity('project_members')
@Unique(['projectId', 'userId'])
@Index(['userId'])
@Index(['projectId', 'role'])
export class ProjectMember extends BaseEntity {
  @Column({ type: 'uuid', name: 'project_id' })
  projectId!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({
    type: 'enum',
    enum: ProjectRole,
    default: ProjectRole.VIEWER,
  })
  role!: ProjectRole;

  @ManyToOne(() => Project, (project) => project.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
