import { apiClient } from "@/lib/api-client";
import type {
  ProjectMemberResponseDto,
  ProjectInvitationResponseDto,
  CreateInvitationDto,
  UpdateMemberRoleDto,
  AcceptInvitationDto,
  TransferProjectDto,
  ProjectRole,
} from "@todo/shared";

export interface CreateInvitationResponse {
  invitation: ProjectInvitationResponseDto;
  token: string;
}

export interface AcceptInvitationResponse {
  projectId: string;
  role: ProjectRole;
}

export const projectMemberService = {
  getMembers: async (projectId: string): Promise<ProjectMemberResponseDto[]> => {
    const response = await apiClient.get<ProjectMemberResponseDto[]>(
      `/projects/${projectId}/members`,
    );
    return response.data;
  },

  updateMemberRole: async (
    projectId: string,
    targetUserId: string,
    dto: UpdateMemberRoleDto,
  ): Promise<ProjectMemberResponseDto> => {
    const response = await apiClient.patch<ProjectMemberResponseDto>(
      `/projects/${projectId}/members/${targetUserId}`,
      dto,
    );
    return response.data;
  },

  removeMember: async (
    projectId: string,
    targetUserId: string,
  ): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}/members/${targetUserId}`);
  },

  createInvitation: async (
    projectId: string,
    dto: CreateInvitationDto,
  ): Promise<CreateInvitationResponse> => {
    const response = await apiClient.post<CreateInvitationResponse>(
      `/projects/${projectId}/invitations`,
      dto,
    );
    return response.data;
  },

  getPendingInvitations: async (
    projectId: string,
  ): Promise<ProjectInvitationResponseDto[]> => {
    const response = await apiClient.get<ProjectInvitationResponseDto[]>(
      `/projects/${projectId}/invitations`,
    );
    return response.data;
  },

  revokeInvitation: async (
    projectId: string,
    invitationId: string,
  ): Promise<void> => {
    await apiClient.delete(
      `/projects/${projectId}/invitations/${invitationId}`,
    );
  },

  acceptInvitation: async (
    dto: AcceptInvitationDto,
  ): Promise<AcceptInvitationResponse> => {
    const response = await apiClient.post<AcceptInvitationResponse>(
      `/projects/invitations/accept`,
      dto,
    );
    return response.data;
  },

  transferOwnership: async (
    projectId: string,
    dto: TransferProjectDto,
  ): Promise<{ success: boolean; newOwnerId: string }> => {
    const response = await apiClient.post<{
      success: boolean;
      newOwnerId: string;
    }>(`/projects/${projectId}/transfer`, dto);
    return response.data;
  },
};
