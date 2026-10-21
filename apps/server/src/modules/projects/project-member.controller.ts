import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ProjectMemberService } from './project-member.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { TransferProjectDto } from './dto/transfer-project.dto';
import {
  CurrentUser,
  type JwtUser,
} from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('projects')
export class ProjectMemberController {
  constructor(private readonly projectMemberService: ProjectMemberService) {}

  @Get('collaborators/suggestions')
  async getCollaboratorSuggestions(
    @CurrentUser() user: JwtUser,
    @Query('projectId') projectId?: string,
    @Query('q') query?: string,
  ) {
    return this.projectMemberService.getCollaboratorSuggestions(
      user.id,
      projectId,
      query,
    );
  }

  @Public()
  @Get('invitations/details')
  async getInvitationDetails(
    @Query('token') token: string,
    @Req() req: Request,
  ) {
    if (!token) {
      return { status: 'not_found' };
    }
    interface RequestWithUser extends Request {
      user?: JwtUser;
    }
    const customReq = req as RequestWithUser;
    let currentUserId: string | undefined = customReq.user?.id;
    if (!currentUserId) {
      const authHeader = customReq.headers?.['authorization'];
      const rawJwt = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : customReq.cookies?.['access_token'];
      if (typeof rawJwt === 'string') {
        try {
          const parts = rawJwt.split('.');
          const payloadPart = parts[1];
          if (parts.length === 3 && payloadPart) {
            const payload = JSON.parse(
              Buffer.from(payloadPart, 'base64').toString('utf8'),
            ) as { sub?: string };
            if (payload && typeof payload.sub === 'string') {
              currentUserId = payload.sub;
            }
          }
        } catch {
          // ignore invalid token in public route
        }
      }
    }
    return this.projectMemberService.getInvitationDetails(token, currentUserId);
  }

  @Get(':projectId/members')
  async getMembers(
    @CurrentUser() user: JwtUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ) {
    return this.projectMemberService.getMembers(user.id, projectId);
  }

  @Patch(':projectId/members/:userId')
  async updateMemberRole(
    @CurrentUser() user: JwtUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
    @Body() body: UpdateMemberRoleDto,
  ) {
    return this.projectMemberService.updateMemberRole(
      user.id,
      projectId,
      targetUserId,
      body,
    );
  }

  @Delete(':projectId/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @CurrentUser() user: JwtUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
  ) {
    await this.projectMemberService.removeMember(
      user.id,
      projectId,
      targetUserId,
    );
  }

  @Post(':projectId/invitations')
  async createInvitation(
    @CurrentUser() user: JwtUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() body: CreateInvitationDto,
  ) {
    return this.projectMemberService.createInvitation(user.id, projectId, body);
  }

  @Get(':projectId/invitations')
  async getPendingInvitations(
    @CurrentUser() user: JwtUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ) {
    return this.projectMemberService.getPendingInvitations(user.id, projectId);
  }

  @Delete(':projectId/invitations/:invitationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeInvitation(
    @CurrentUser() user: JwtUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('invitationId', ParseUUIDPipe) invitationId: string,
  ) {
    await this.projectMemberService.revokeInvitation(
      user.id,
      projectId,
      invitationId,
    );
  }

  @Post(':projectId/invitations/:invitationId/resend')
  @HttpCode(HttpStatus.OK)
  async resendInvitation(
    @CurrentUser() user: JwtUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('invitationId', ParseUUIDPipe) invitationId: string,
  ) {
    return this.projectMemberService.resendInvitation(
      user.id,
      projectId,
      invitationId,
    );
  }

  @Post('invitations/accept')
  async acceptInvitation(
    @CurrentUser() user: JwtUser,
    @Body() body: AcceptInvitationDto,
  ) {
    return this.projectMemberService.acceptInvitation(user.id, body);
  }

  @Post(':projectId/transfer')
  @HttpCode(HttpStatus.OK)
  async transferOwnership(
    @CurrentUser() user: JwtUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() body: TransferProjectDto,
  ) {
    return this.projectMemberService.transferOwnership(
      user.id,
      projectId,
      body,
    );
  }
}
