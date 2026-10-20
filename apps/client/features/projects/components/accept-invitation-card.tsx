"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UsersIcon, CheckCircle2Icon, AlertCircleIcon, Loader2Icon, ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/providers/AuthProvider";
import { useAcceptInvitation } from "@/features/projects/hooks/use-accept-invitation";
import { toast } from "@/components/ui/toast";

interface AcceptInvitationCardProps {
  token: string | null;
}

export function AcceptInvitationCard({ token }: AcceptInvitationCardProps) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const isAuthenticated = Boolean(user);
  const acceptMutation = useAcceptInvitation();
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!token) {
    return (
      <Card className="w-full shadow-lg border border-border/80">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-2">
            <AlertCircleIcon className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Invalid Invitation Link
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            This invitation link is missing a security token. Please check the URL or ask the project owner to send a new invitation.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <Button
            variant="outline"
            className="w-full py-5 text-sm font-medium gap-2 cursor-pointer"
            render={<Link href="/" />}
            nativeButton={false}
          >
            <span>Return to Workspace</span>
            <ArrowRightIcon className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isSuccess) {
    return (
      <Card className="w-full shadow-lg border border-border/80">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2">
            <CheckCircle2Icon className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Invitation Accepted!
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            You are now a collaborator on this project. Redirecting to your project board...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (authLoading) {
    return (
      <Card className="w-full shadow-lg border border-border/80">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
            <Loader2Icon className="w-6 h-6 animate-spin" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight">
            Checking authentication...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  // User is not logged in: prompt them to sign in or create an account
  if (!isAuthenticated) {
    const returnUrl = `/invitations/accept?token=${encodeURIComponent(token)}`;
    const signInHref = `/auth/sign-in?redirect=${encodeURIComponent(returnUrl)}`;
    const signUpHref = `/auth/sign-up?redirect=${encodeURIComponent(returnUrl)}`;

    return (
      <Card className="w-full shadow-lg border border-border/80">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
            <UsersIcon className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Project Invitation
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            You&apos;ve been invited to collaborate on a project. Please sign in or create an account to accept this invitation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            className="w-full py-5 text-sm font-medium gap-2 cursor-pointer"
            render={<Link href={signInHref} />}
            nativeButton={false}
          >
            <span>Sign In to Accept</span>
            <ArrowRightIcon className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            className="w-full py-5 text-sm font-medium gap-2 cursor-pointer"
            render={<Link href={signUpHref} />}
            nativeButton={false}
          >
            <span>Create an Account</span>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // User is logged in: explicit action button to accept the invitation
  const handleAccept = () => {
    setErrorMessage(null);
    acceptMutation.mutate(
      { token },
      {
        onSuccess: (data) => {
          setIsSuccess(true);
          toast.add({
            title: "Invitation accepted",
            description: "You have joined the project.",
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
          Join Project
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          You are signed in as <span className="font-semibold text-foreground">{user?.email}</span>. Click below to accept the invitation and begin collaborating.
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
