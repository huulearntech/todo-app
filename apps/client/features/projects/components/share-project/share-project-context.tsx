"use client";

import { createContext, useContext, type ReactNode } from "react";
import type {
  ProjectRole,
  ProjectMemberResponseDto,
  ProjectInvitationResponseDto,
  CollaboratorSuggestionDto,
} from "@todo/shared";
import type { ProjectAbility } from "@/features/projects/permissions";

export interface ShareProjectContextValue {
  projectId: string;
  ability: ProjectAbility;
  currentUserId?: string;
  members: ProjectMemberResponseDto[];
  invitations: ProjectInvitationResponseDto[];
  suggestions: CollaboratorSuggestionDto[];
  recentTokens: Record<string, string>;
  isInviting: boolean;
  isUpdatingRole: boolean;
  isRemovingMember: boolean;
  isResendingInvite: boolean;
  isRevokingInvite: boolean;
  onSendInvite: (email: string, role: ProjectRole) => Promise<void>;
  onUpdateRole: (userId: string, role: ProjectRole) => void;
  onRemoveMember: (userId: string) => void;
  onTransfer: (member: ProjectMemberResponseDto) => void;
  onCopyLink: (url: string) => void;
  onResendInvite: (invitationId: string) => void;
  onRevokeInvite: (invitationId: string) => void;
}

const ShareProjectContext = createContext<ShareProjectContextValue | null>(null);

export function ShareProjectProvider({
  value,
  children,
}: {
  value: ShareProjectContextValue;
  children: ReactNode;
}) {
  return (
    <ShareProjectContext.Provider value={value}>
      {children}
    </ShareProjectContext.Provider>
  );
}

export function useShareProjectContext(): ShareProjectContextValue {
  const context = useContext(ShareProjectContext);
  if (!context) {
    throw new Error(
      "useShareProjectContext must be used within a ShareProjectProvider"
    );
  }
  return context;
}
