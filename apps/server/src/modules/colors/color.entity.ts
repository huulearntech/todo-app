import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Project } from '../projects/project.entity';
import { TaskLabel } from '../task-labels/task-label.entity';

@Entity('colors')
export class Color {
  @PrimaryColumn({ type: 'uuid', name: 'owner_id' })
  ownerId!: string;

  @PrimaryColumn({ type: 'varchar', length: 50, name: 'key' })
  key!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @ManyToOne(() => User, (user) => user.colors, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner!: User;

  @OneToMany(() => Project, (project) => project.color)
  projects!: Project[];

  @OneToMany(() => TaskLabel, (taskLabel) => taskLabel.color)
  taskLabels!: TaskLabel[];
}
