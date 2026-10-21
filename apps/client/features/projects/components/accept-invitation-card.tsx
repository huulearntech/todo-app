"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UsersIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  Loader2Icon,
  ArrowRightIcon,
  ClockIcon,
  BanIcon,
  RefreshCwIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/providers/AuthProvider";
import { useAcceptInvitation } from "@/features/projects/hooks/use-accept-invitation";
import { useInvitationDetails } from "@/features/projects/hooks/use-invitation-details";
import { toast } from "@/components/ui/toast";
import { InvitationStatusNoticeCard } from "./accept-invitation/invitation-status-notice-card";
import { UnauthenticatedInviteCard } from "./accept-invitation/unauthenticated-invite-card";

interface AcceptInvitationCardProps {
  token: string | null;
}

export function AcceptInvitationCard({ token }: AcceptInvitationCardProps) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const isAuthenticated = Boolean(user);

  const { data: details, isLoading: detailsLoading } = useInvitationDetails(token);
  const acceptMutation = useAcceptInvitation();

  const [isSuccess, setIsSuccess] = useState(false);
  const [successProjectId, setSuccessProjectId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!token) {
    return (
      <InvitationStatusNoticeCard
        icon={AlertCircleIcon}
        iconContainerClassName="bg-destructive/10 text-destructive"
        title="Invalid Invitation Link"
        description="This invitation link is missing a security token. Please check the URL or ask the project owner to send a new invitation."
        action={{
          label: "Return to Workspace",
          href: "/",
        }}
      />
    );
  }

  if (detailsLoading || authLoading) {
    return (
      <InvitationStatusNoticeCard
        icon={Loader2Icon}
        iconContainerClassName="bg-primary/10 text-primary"
        title="Verifying invitation..."
        description="Please wait while we check this invitation link."
      />
    );
  }

  if (isSuccess && successProjectId) {
    return (
      <InvitationStatusNoticeCard
        icon={CheckCircle2Icon}
        iconContainerClassName="bg-emerald-500/10 text-emerald-500"
        title="Invitation Accepted!"
        description="You are now a collaborator on this project. Redirecting to your project board..."
        action={{
          label: "Go to Project Board",
          href: `/projects/${successProjectId}`,
          variant: "default",
        }}
      />
    );
  }

  if (details?.status === "already_member") {
    return (
      <InvitationStatusNoticeCard
        icon={CheckCircle2Icon}
        iconContainerClassName="bg-primary/10 text-primary"
        title="Already a Member"
        description={
          <>
            You are already a member of{" "}
            <span className="font-semibold text-foreground">
              {details.projectName}
            </span>
            . You have full access to view and collaborate on tasks.
          </>
        }
        action={{
          label: "Go to Project Board",
          href: `/projects/${details.projectId}`,
          variant: "default",
        }}
      />
    );
  }

  if (details?.status === "superseded") {
    return (
      <InvitationStatusNoticeCard
        icon={RefreshCwIcon}
        iconContainerClassName="bg-amber-500/10 text-amber-500"
        title="Invitation Link Replaced"
        description={
          <>
            A newer invitation link has been sent for{" "}
            <span className="font-semibold text-foreground">
              {details.projectName ?? "this project"}
            </span>
            . For security reasons, earlier links are deactivated. Please check your latest email or request the project owner to resend the invite.
          </>
        }
        action={{
          label: "Return to Workspace",
          href: "/",
        }}
      />
    );
  }

  if (details?.status === "expired") {
    return (
      <InvitationStatusNoticeCard
        icon={ClockIcon}
        iconContainerClassName="bg-destructive/10 text-destructive"
        title="Invitation Expired"
        description={
          <>
            This invitation link for{" "}
            <span className="font-semibold text-foreground">
              {details.projectName ?? "this project"}
            </span>{" "}
            has expired. Please ask the project owner or administrator to send a new invitation.
          </>
        }
        action={{
          label: "Return to Workspace",
          href: "/",
        }}
      />
    );
  }

  if (details?.status === "revoked") {
    return (
      <InvitationStatusNoticeCard
        icon={BanIcon}
        iconContainerClassName="bg-destructive/10 text-destructive"
        title="Invitation Revoked"
        description="This invitation has been cancelled by the project owner."
        action={{
          label: "Return to Workspace",
          href: "/",
        }}
      />
    );
  }

  if (details?.status === "not_found") {
    return (
      <InvitationStatusNoticeCard
        icon={AlertCircleIcon}
        iconContainerClassName="bg-destructive/10 text-destructive"
        title="Invitation Not Found"
        description="This invitation link is invalid or no longer exists. Please contact the person who invited you."
        action={{
          label: "Return to Workspace",
          href: "/",
        }}
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <UnauthenticatedInviteCard
        token={token}
        inviterName={details?.inviterName}
        projectName={details?.projectName}
        role={details?.role}
      />
    );
  }

  const handleAccept = () => {
    setErrorMessage(null);
    acceptMutation.mutate(
      { token },
      {
        onSuccess: (data) => {
          setIsSuccess(true);
          setSuccessProjectId(data.projectId);
          toast.add({
            title: data.alreadyMember ? "Already a member" : "Invitation accepted",
            description: data.alreadyMember
              ? "You are already a member of this project."
              : "You have joined the project.",
            type: "success",
          });
          setTimeout(() => {
            router.push(`/projects/${data.projectId}`);
          }, 1200);
        },
        onError: (err: unknown) => {
          let message = "Failed to accept invitation. The invitation may be expired or invalid.";
          if (err && typeof err === "object" && "response" in err) {
            const resp = (err as { response?: { data?: { message?: string } } }).response;
            if (resp?.data?.message) {
              message = resp.data.message;
            }
          }
          setErrorMessage(message);
        },
      }
    );
  };

  return (
    <Card className="w-full shadow-lg border border-border/80">
      <CardHeader className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
          <UsersIcon className="w-6 h-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          Join {details?.projectName ?? "Project"}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground leading-relaxed">
          {details?.inviterName ? (
            <>
              <span className="font-semibold text-foreground">
                {details.inviterName}
              </span>{" "}
              invited you to join as{" "}
              <Badge variant="outline" className="text-xs capitalize font-medium">
                {details.role}
              </Badge>
              .
            </>
          ) : (
            "You have been invited to join this project."
          )}{" "}
          You are signed in as{" "}
          <span className="font-semibold text-foreground">{user?.email}</span>.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {errorMessage && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
            <AlertCircleIcon className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <Button
          onClick={handleAccept}
          disabled={acceptMutation.isPending}
          className="w-full py-5 text-sm font-medium gap-2 cursor-pointer"
        >
          {acceptMutation.isPending ? (
            <>
              <Loader2Icon className="w-4 h-4 animate-spin" />
              <span>Joining Project...</span>
            </>
          ) : (
            <>
              <span>Accept Invitation</span>
              <ArrowRightIcon className="w-4 h-4" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
