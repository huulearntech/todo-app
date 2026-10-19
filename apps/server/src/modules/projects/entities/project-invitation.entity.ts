import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/database/base.entity';
import { Project } from '../project.entity';
import { User } from '../../users/user.entity';
import { ProjectRole, ProjectInvitationStatus } from '@todo/shared';

@Entity('project_invitations')
@Index(['projectId', 'status'])
@Index('uq_project_invitations_pending_email', ['projectId', 'invitedEmail'], {
  unique: true,
  where: "status = 'pending'",
})
@Index('idx_project_invitations_token_hash', ['tokenHash'], { unique: true })
export class ProjectInvitation extends BaseEntity {
  @Column({ type: 'uuid', name: 'project_id' })
  projectId!: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'invited_email',
    transformer: {
      to: (value: string) => (value ? value.trim().toLowerCase() : value),
      from: (value: string) => value,
    },
  })
  invitedEmail!: string;

  @Column({
    type: 'enum',
    enum: ProjectRole,
    default: ProjectRole.VIEWER,
  })
  role!: ProjectRole;

  @Column({
    type: 'enum',
    enum: ProjectInvitationStatus,
    default: ProjectInvitationStatus.PENDING,
  })
  status!: ProjectInvitationStatus;

  @Column({ type: 'varchar', length: 64, name: 'token_hash' })
  tokenHash!: string;

  @Column({ type: 'timestamptz', precision: 3, name: 'expires_at' })
  expiresAt!: Date;

  @Column({ type: 'uuid', name: 'invited_by_id' })
  invitedById!: string;

  @ManyToOne(() => Project, (project) => project.invitations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invited_by_id' })
  invitedBy!: User;
}
