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
  token!: string; // Best practice: Store a hashed version of the token or a unique JTI (JWT ID)

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @Column({ type: 'boolean', default: false })
  isRevoked!: boolean;

  // Optional but recommended metadata for tracking sessions
  @Column({ type: 'varchar', nullable: true })
  ipAddress?: string;

  @Column({ type: 'varchar', nullable: true })
  userAgent?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  // Relationship setup: Multiple refresh tokens belong to one user
  @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
