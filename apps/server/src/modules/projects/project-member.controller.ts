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
} from '@nestjs/common';
import { ProjectMemberService } from './project-member.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { TransferProjectDto } from './dto/transfer-project.dto';
import {
  CurrentUser,
  type JwtUser,
} from '../auth/decorators/current-user.decorator';

@Controller('projects')
export class ProjectMemberController {
  constructor(private readonly projectMemberService: ProjectMemberService) {}

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
