import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne, 
  JoinColumn,
  Index
} from "typeorm";
import { User } from "../../users/user.entity"; // Adjust the import path as needed

@Entity({ name: 'refresh_tokens' })
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  token!: string;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt!: Date;

  @Column({ type: 'boolean', name: 'is_revoked', default: false })
  isRevoked!: boolean;

  // Optional but recommended metadata for tracking sessions
  @Column({ type: 'varchar', name: 'ip_address', nullable: true })
  ipAddress?: string;

  @Column({ type: 'varchar', name: 'user_agent', nullable: true })
  userAgent?: string;

  @CreateDateColumn({ type: 'timestamptz', precision: 3, name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', precision: 3, name: 'updated_at' })
  updatedAt!: Date;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  // Relationship setup: Multiple refresh tokens belong to one user
  @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
