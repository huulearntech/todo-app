import { Column, CreateDateColumn, Entity, Index, ManyToMany, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Task } from '../tasks/task.entity';
import { User } from '../users/user.entity';

@Entity('task_labels')
@Index(['name', 'ownerId'], { unique: true }) // NOTE: This ensures that a user cannot create two labels with the same name.
export class TaskLabel {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToMany(() => Task, (task) => task.labels)
  tasks!: Task[];

  @CreateDateColumn({ type: 'timestamptz', precision: 3, name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', precision: 3, name: 'updated_at' })
  updatedAt!: Date;

  @Column({ type: 'uuid', name: 'owner_id' })
  ownerId!: string;

  @ManyToOne(() => User, owner => owner.taskLabels, { onDelete: 'CASCADE' })
  owner!: User;
}
