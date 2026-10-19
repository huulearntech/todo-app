import {
  Entity,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import { BaseEntity } from '../../common/database/base.entity';
import { User } from '../users/user.entity';
import { Section } from '../sections/section.entity';
import { TrigramIndex } from '../../common/decorators/trigram-index.decorator';
import { ProjectMember } from './entities/project-member.entity';
import { ProjectInvitation } from './entities/project-invitation.entity';

@Entity('projects')
@Index(['ownerId', 'id'])
@Index(['ownerId', 'name'], { unique: true }) // NOTE: Should this be?
export class Project extends BaseEntity {
  @TrigramIndex()
  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'uuid', name: 'owner_id' })
  ownerId!: string;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'color_key',
    default: 'slate',
  })
  colorKey!: string;

  @ManyToOne(() => User, (user) => user.projects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner!: User;

  @OneToMany(() => Section, (section) => section.project, { cascade: true })
  sections!: Section[];

  @OneToMany(() => ProjectMember, (member) => member.project, { cascade: true })
  members!: ProjectMember[];

  @OneToMany(() => ProjectInvitation, (invitation) => invitation.project, {
    cascade: true,
  })
  invitations!: ProjectInvitation[];
}
