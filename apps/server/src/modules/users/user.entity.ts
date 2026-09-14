import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

import { Task } from '../tasks/task.entity';
import { RefreshToken } from '../jwt/entities/refresh-token.entity';
import { TaskLabel } from '../task-labels/task-label.entity';
import { Project } from '../projects/project.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  name!: string;

  @Column({ name: 'password_hashed' })
  passwordHashed!: string;

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

  @OneToMany(() => Task, task => task.owner, { cascade: true })
  tasks!: Task[];

  @OneToMany(() => TaskLabel, taskLabel => taskLabel.owner, { cascade: true })
  taskLabels!: TaskLabel[];

  @OneToMany(() => Project, project => project.owner, { cascade: true })
  projects!: Project[];

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens!: RefreshToken[];  
}