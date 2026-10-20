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
import {
  ProjectRole,
  ProjectInvitationStatus,
  canChangeMemberRole,
  canRemoveMember,
  canInviteWithRole,
} from '@todo/shared';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { TransferProjectDto } from './dto/transfer-project.dto';

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

    if (!canChangeMemberRole(actingRole, targetMember.role, dto.role)) {
      if (actingRole === ProjectRole.ADMIN && targetMember.role === ProjectRole.ADMIN) {
        throw new ForbiddenException(
          'Administrators cannot change roles of other administrators',
        );
      }
      if (actingRole === ProjectRole.ADMIN && dto.role === ProjectRole.ADMIN) {
        throw new ForbiddenException(
          'Only project owners can promote members to administrator',
        );
      }
      throw new ForbiddenException(
        'Insufficient permissions to change this member role',
      );
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

    if (!canRemoveMember(actingRole, targetMember.role, false)) {
      if (
        actingRole === ProjectRole.ADMIN &&
        targetMember.role === ProjectRole.ADMIN
      ) {
        throw new ForbiddenException(
          'Administrators cannot remove other administrators',
        );
      }
      throw new ForbiddenException(
        'Insufficient permissions to remove this member',
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

    if (!canInviteWithRole(actingRole, dto.role)) {
      if (actingRole === ProjectRole.ADMIN && dto.role === ProjectRole.ADMIN) {
        throw new ForbiddenException(
          'Only project owners can invite administrators',
        );
      }
      throw new ForbiddenException(
        'Insufficient permissions to invite with this role',
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

  async transferOwnership(
    actingUserId: string,
    projectId: string,
    dto: TransferProjectDto,
  ): Promise<{ success: boolean; newOwnerId: string }> {
    if (actingUserId === dto.newOwnerId) {
      throw new BadRequestException('Cannot transfer ownership to yourself');
    }

    const user = await this.userRepository.findOne({
      where: { id: actingUserId },
    });
    if (user && user.defaultProjectId === projectId) {
      throw new ConflictException('Cannot transfer default inbox project');
    }

    await this.dataSource.transaction(async (manager) => {
      const project = await manager.findOne(Project, {
        where: { id: projectId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      if (project.ownerId !== actingUserId) {
        throw new ForbiddenException(
          'Only the project owner can transfer ownership',
        );
      }

      const targetMember = await manager.findOne(ProjectMember, {
        where: { projectId, userId: dto.newOwnerId },
      });

      if (!targetMember) {
        throw new NotFoundException(
          'Target user is not a member of this project',
        );
      }

      const currentOwnerMember = await manager.findOne(ProjectMember, {
        where: { projectId, userId: actingUserId },
      });

      project.ownerId = dto.newOwnerId;
      targetMember.role = ProjectRole.OWNER;

      if (currentOwnerMember) {
        currentOwnerMember.role = ProjectRole.ADMIN;
        await manager.save(currentOwnerMember);
      }

      await manager.save(targetMember);
      await manager.save(project);
    });

    return {
      success: true,
      newOwnerId: dto.newOwnerId,
    };
  }
}
