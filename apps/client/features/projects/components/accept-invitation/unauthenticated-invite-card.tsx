"use client";

import Link from "next/link";
import { UsersIcon, ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface UnauthenticatedInviteCardProps {
  token: string;
  inviterName?: string | null;
  projectName?: string | null;
  role?: string | null;
}

export function UnauthenticatedInviteCard({
  token,
  inviterName,
  projectName,
  role,
}: UnauthenticatedInviteCardProps) {
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
        <CardDescription className="text-sm text-muted-foreground leading-relaxed">
          {inviterName ? (
            <>
              <span className="font-semibold text-foreground">{inviterName}</span>{" "}
              invited you to collaborate on{" "}
              <span className="font-semibold text-foreground">
                {projectName}
              </span>{" "}
              as a{" "}
              <span className="font-semibold text-foreground capitalize">
                {role}
              </span>
              .
            </>
          ) : (
            "You've been invited to collaborate on a project."
          )}{" "}
          Please sign in or create an account to accept this invitation.
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
