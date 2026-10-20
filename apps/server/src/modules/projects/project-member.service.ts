import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerSchedulerService } from '../mailer/services/mailer-scheduler.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import crypto from 'node:crypto';
import { ProjectMember } from './entities/project-member.entity';
import { ProjectInvitation } from './entities/project-invitation.entity';
import { Project } from './project.entity';
import { User } from '../users/user.entity';
import { ProjectAccessService } from './authorization/project-access.service';
import { ProjectRole, ProjectInvitationStatus } from '@todo/shared';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';

@Injectable()
export class ProjectMemberService {
  constructor(
    @InjectRepository(ProjectMember)
    private readonly memberRepository: Repository<ProjectMember>,
    @InjectRepository(ProjectInvitation)
    private readonly invitationRepository: Repository<ProjectInvitation>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly projectAccessService: ProjectAccessService,
    private readonly dataSource: DataSource,
    @Optional() private readonly configService?: ConfigService,
    @Optional() private readonly mailerSchedulerService?: MailerSchedulerService,
  ) {}

  async getMembers(
    actingUserId: string,
    projectId: string,
  ): Promise<ProjectMember[]> {
    await this.projectAccessService.assertCan(
      actingUserId,
      projectId,
      'member:read',
    );

    return this.memberRepository.find({
      where: { projectId },
      relations: { user: true },
      order: { createdAt: 'ASC' },
    });
  }

  async updateMemberRole(
    actingUserId: string,
    projectId: string,
    targetUserId: string,
    dto: UpdateMemberRoleDto,
  ): Promise<ProjectMember> {
    const actingRole = await this.projectAccessService.assertCan(
      actingUserId,
      projectId,
      'member:manage',
    );

    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.ownerId === targetUserId) {
      throw new ForbiddenException(
        'Cannot change the role of the project owner',
      );
    }

    const targetMember = await this.memberRepository.findOne({
      where: { projectId, userId: targetUserId },
      relations: { user: true },
    });

    if (!targetMember) {
      throw new NotFoundException('Member not found');
    }

    if (actingRole === ProjectRole.ADMIN) {
      if (targetMember.role === ProjectRole.ADMIN) {
        throw new ForbiddenException(
          'Administrators cannot change roles of other administrators',
        );
      }
      if (dto.role === ProjectRole.ADMIN) {
        throw new ForbiddenException(
          'Only project owners can promote members to administrator',
        );
      }
    }

    targetMember.role = dto.role;
    return this.memberRepository.save(targetMember);
  }

  async removeMember(
    actingUserId: string,
    projectId: string,
    targetUserId: string,
  ): Promise<void> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (targetUserId === project.ownerId) {
      throw new ForbiddenException('Cannot remove the project owner');
    }

    const targetMember = await this.memberRepository.findOne({
      where: { projectId, userId: targetUserId },
    });

    if (!targetMember) {
      throw new NotFoundException('Member not found');
    }

    if (actingUserId === targetUserId) {
      // Voluntary leave by a non-owner member
      await this.memberRepository.delete({ id: targetMember.id });
      return;
    }

    // Removing another member requires member:manage
    const actingRole = await this.projectAccessService.assertCan(
      actingUserId,
      projectId,
      'member:manage',
    );

    if (
      actingRole === ProjectRole.ADMIN &&
      targetMember.role === ProjectRole.ADMIN
    ) {
      throw new ForbiddenException(
        'Administrators cannot remove other administrators',
      );
    }

    await this.memberRepository.delete({ id: targetMember.id });
  }

  async createInvitation(
    actingUserId: string,
    projectId: string,
    dto: CreateInvitationDto,
  ): Promise<{ invitation: ProjectInvitation; token: string }> {
    const actingRole = await this.projectAccessService.assertCan(
      actingUserId,
      projectId,
      'member:invite',
    );

    // Default inbox projects cannot be shared
    const isInbox = await this.userRepository.findOne({
      where: { defaultProjectId: projectId },
    });
    if (isInbox) {
      throw new ConflictException(
        'Cannot invite collaborators to default inbox project',
      );
    }

    if (actingRole === ProjectRole.ADMIN && dto.role === ProjectRole.ADMIN) {
      throw new ForbiddenException(
        'Only project owners can invite administrators',
      );
    }

    const normalizedEmail = dto.email.trim().toLowerCase();

    // Check if target user is already a member
    const existingUser = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      const existingMember = await this.memberRepository.findOne({
        where: { projectId, userId: existingUser.id },
      });
      if (existingMember) {
        throw new ConflictException('User is already a member of this project');
      }
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const existingPending = await this.invitationRepository.findOne({
      where: {
        projectId,
        invitedEmail: normalizedEmail,
        status: ProjectInvitationStatus.PENDING,
      },
    });

    let invitation: ProjectInvitation;
    if (existingPending) {
      existingPending.tokenHash = tokenHash;
      existingPending.role = dto.role;
      existingPending.expiresAt = expiresAt;
      existingPending.invitedById = actingUserId;
      invitation = await this.invitationRepository.save(existingPending);
    } else {
      const newInvitation = this.invitationRepository.create({
        projectId,
        invitedEmail: normalizedEmail,
        role: dto.role,
        status: ProjectInvitationStatus.PENDING,
        tokenHash,
        expiresAt,
        invitedById: actingUserId,
      });
      invitation = await this.invitationRepository.save(newInvitation);
    }

    const inviter = await this.userRepository.findOne({
      where: { id: actingUserId },
    });
    const inviterName = inviter?.name || inviter?.email || 'A team member';
    const frontendBaseUrl =
      this.configService?.get<string>('FRONTEND_URL') ||
      'http://localhost:3000';
    const acceptUrl = `${frontendBaseUrl}/invitations/accept?token=${rawToken}`;

    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });
    const projectName = project?.name || 'Todo Project';

    if (this.mailerSchedulerService) {
      await this.mailerSchedulerService.sendImmediateEmail({
        to: normalizedEmail,
        subject: `You've been invited to collaborate on "${projectName}"`,
        templateType: 'project-invitation',
        context: {
          name: inviterName,
          projectName,
          role: dto.role,
          actionUrl: acceptUrl,
        },
      });
    }

    return { invitation, token: rawToken };
  }

  async getPendingInvitations(
    actingUserId: string,
    projectId: string,
  ): Promise<ProjectInvitation[]> {
    await this.projectAccessService.assertCan(
      actingUserId,
      projectId,
      'member:read',
    );

    return this.invitationRepository.find({
      where: {
        projectId,
        status: ProjectInvitationStatus.PENDING,
      },
      relations: { invitedBy: true },
      order: { createdAt: 'DESC' },
    });
  }

  async revokeInvitation(
    actingUserId: string,
    projectId: string,
    invitationId: string,
  ): Promise<void> {
    await this.projectAccessService.assertCan(
      actingUserId,
      projectId,
      'member:invite',
    );

    const invitation = await this.invitationRepository.findOne({
      where: { id: invitationId, projectId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    invitation.status = ProjectInvitationStatus.REVOKED;
    await this.invitationRepository.save(invitation);
  }

  async acceptInvitation(
    userId: string,
    dto: AcceptInvitationDto,
  ): Promise<{ projectId: string; role: ProjectRole }> {
    const tokenHash = crypto
      .createHash('sha256')
      .update(dto.token)
      .digest('hex');

    const invitation = await this.invitationRepository.findOne({
      where: {
        tokenHash,
        status: ProjectInvitationStatus.PENDING,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invalid or expired invitation');
    }

    if (invitation.expiresAt < new Date()) {
      invitation.status = ProjectInvitationStatus.EXPIRED;
      await this.invitationRepository.save(invitation);
      throw new BadRequestException('Invitation has expired');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.email.toLowerCase() !== invitation.invitedEmail.toLowerCase()) {
      throw new ForbiddenException(
        'This invitation was sent to a different email address',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      invitation.status = ProjectInvitationStatus.ACCEPTED;
      await manager.save(invitation);

      const existingMember = await manager.findOne(ProjectMember, {
        where: { projectId: invitation.projectId, userId },
      });

      if (existingMember) {
        existingMember.role = invitation.role;
        await manager.save(existingMember);
      } else {
        const newMember = manager.create(ProjectMember, {
          projectId: invitation.projectId,
          userId,
          role: invitation.role,
        });
        await manager.save(newMember);
      }
    });

    return {
      projectId: invitation.projectId,
      role: invitation.role,
    };
  }
}
