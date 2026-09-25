import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';

import { RefreshToken } from '../jwt/entities/refresh-token.entity';
import { TaskLabel } from '../task-labels/task-label.entity';
import { Project } from '../projects/project.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ name: 'password_hashed' })
  passwordHashed: string;

  @CreateDateColumn({ type: 'timestamptz', precision: 3, name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', precision: 3, name: 'updated_at' })
  updatedAt: Date;


  @Column({ type: 'text', name: 'avatar_url', nullable: true })
  avatarUrl?: string | null;

  @Column({ type: 'uuid', name: 'default_project_id', nullable: true })
  defaultProjectId: string | null;

  // TODO: Verify email after registration.
  // @Column({ name: 'is_email_verified', default: false })
  // isEmailVerified!: boolean;



  // @OneToMany(() => Task, task => task.owner, { cascade: true })
  // tasks!: Task[];

  @OneToMany(() => TaskLabel, taskLabel => taskLabel.owner, { cascade: true })
  taskLabels: TaskLabel[];

  @OneToMany(() => Project, project => project.owner, { cascade: true })
  projects: Project[];

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens: RefreshToken[];  
}