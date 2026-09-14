import { Column, Entity, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Task } from '../tasks/task.entity';
import { User } from '../users/user.entity';

@Entity('task_labels')
export class TaskLabel {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToMany(() => Task, (task) => task.labels)
  tasks!: Task[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;

  @Column({ type: 'uuid', name: 'owner_id' }) // NOTE: This is the ID of the user who created the label. How to name it?
  ownerId!: string;

  @ManyToOne(() => User, owner => owner.taskLabels, { onDelete: 'CASCADE' })
  owner!: User;
}
