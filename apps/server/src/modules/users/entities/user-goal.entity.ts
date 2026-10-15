import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/database/base.entity';
import { User } from '../user.entity';

@Entity('user_goals')
@Index('idx_user_goals_user_effective', ['userId', 'effectiveFrom'])
@Index('uq_user_goals_active', ['userId'], {
  unique: true,
  where: 'effective_to IS NULL',
})
export class UserGoal extends BaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.goals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'int', name: 'daily_goal', default: 5 })
  dailyGoal: number;

  @Column({ type: 'int', name: 'weekly_goal', default: 20 })
  weeklyGoal: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'effective_from' })
  effectiveFrom: Date;

  @Column({ type: 'timestamptz', name: 'effective_to', nullable: true })
  effectiveTo: Date | null;
}
