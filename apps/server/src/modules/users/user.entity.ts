import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';

import { BaseEntity } from '../../common/database/base.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { MagicLinkToken } from '../auth/entities/magic-link-token.entity';
import { PasswordResetToken } from '../auth/entities/password-reset-token.entity';
import { TaskLabel } from '../task-labels/task-label.entity';
import { Project } from '../projects/project.entity';
import { UserGoal } from './entities/user-goal.entity';
import { Section } from '../sections/section.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({
    unique: true,
    transformer: {
      to: (value: string) => (value ? value.trim().toLowerCase() : value),
      from: (value: string) => value,
    },
  })
  email: string;

  @Column()
  name: string;

  @Column({ name: 'password_hashed' })
  passwordHashed: string;

  @Column({ type: 'text', name: 'avatar_url', nullable: true })
  avatarUrl?: string | null;

  @Column({ type: 'uuid', name: 'default_project_id', update: false })
  defaultProjectId: string;

  @ManyToOne(() => Project, {
    onDelete: 'RESTRICT',
    deferrable: 'INITIALLY DEFERRED',
  })
  @JoinColumn({ name: 'default_project_id' })
  defaultProject?: Project;

  @Column({ name: 'is_email_verified', default: false })
  isEmailVerified!: boolean;

  // @OneToMany(() => Task, task => task.owner, { cascade: true })
  // tasks!: Task[];

  @OneToMany(() => TaskLabel, (taskLabel) => taskLabel.owner, { cascade: true })
  taskLabels: TaskLabel[];

  @OneToMany(() => Project, (project) => project.owner, { cascade: true })
  projects: Project[];

  @OneToMany(() => Section, (section) => section.owner, { cascade: true })
  sections?: Section[];

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens: RefreshToken[];

  @OneToMany(() => MagicLinkToken, (magicLinkToken) => magicLinkToken.user)
  magicLinkTokens: MagicLinkToken[];

  @OneToMany(
    () => PasswordResetToken,
    (passwordResetToken) => passwordResetToken.user,
  )
  passwordResetTokens?: PasswordResetToken[];

  @OneToMany(() => UserGoal, (userGoal) => userGoal.user, { cascade: true })
  goals?: UserGoal[];
}
