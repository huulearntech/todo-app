"use client";

import * as React from "react";
import Link from "next/link";
import Avatar from "@/components/profile/avatar";
import UserProfileForm from "@/components/profile/user-profile-form";
import { useAuth } from "@/providers/AuthProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  UserCheckIcon,
  ShieldIcon,
  LogInIcon,
  SparklesIcon,
  FolderIcon,
} from "lucide-react";

export default function ProfilePage() {
  const { user, isLoading } = useAuth();

  // Skeleton loading state
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-28 rounded-md" />
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>

        {/* Hero Card Skeleton */}
        <Card className="rounded-2xl border border-border/60 p-6">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <Skeleton className="size-20 md:size-24 rounded-full shrink-0" />
            <div className="space-y-2 text-center sm:text-left flex-1">
              <Skeleton className="h-6 w-44 rounded-md mx-auto sm:mx-0" />
              <Skeleton className="h-4 w-60 rounded-md mx-auto sm:mx-0" />
              <div className="flex gap-2 justify-center sm:justify-start pt-1">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
            </div>
          </div>
        </Card>

        {/* Form Skeleton */}
        <Card className="rounded-2xl border border-border/60 p-6 space-y-4">
          <Skeleton className="h-5 w-36 rounded-md" />
          <Skeleton className="h-4 w-64 rounded-md" />
          <div className="space-y-3 pt-2">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </Card>
      </div>
    );
  }

  // Unauthenticated fallback state
  if (!user) {
    return (
      <Card className="rounded-2xl border border-border/70 bg-card p-8 text-center max-w-md mx-auto my-12 shadow-xs">
        <div className="p-3 rounded-full bg-primary/10 text-primary w-fit mx-auto mb-4">
          <LogInIcon className="size-6" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Sign In Required
        </h2>
        <p className="text-xs text-muted-foreground mt-1.5 mb-6 max-w-xs mx-auto leading-relaxed">
          Please sign in to view and update your personal profile, avatar, and settings.
        </p>
        <Button
          className="rounded-xl h-9 text-xs font-semibold px-5 shadow-xs"
          render={<Link href="/auth" />}
          nativeButton={false}
        >
          Sign In
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title & Breadcrumb */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <span>Settings</span>
          <span>/</span>
          <span className="text-foreground">Profile</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Profile Settings
        </h1>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Manage your personal identity, avatar image, and account contact information.
        </p>
      </div>

      {/* User Hero Banner Card */}
      <Card className="rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card to-primary/5 text-card-foreground shadow-xs overflow-hidden">
        <CardContent className="p-5 sm:p-6 md:p-7">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar with Camera Trigger & Dialog */}
            <div className="shrink-0">
              <Avatar
                avatarUrl={user.avatarUrl ?? undefined}
                name={user.name}
              />
            </div>

            {/* Profile Identity Details */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {user.name}
                </h2>
                <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                  <Badge
                    variant="secondary"
                    className="text-[11px] h-5 rounded-full px-2 py-0 font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 gap-1"
                  >
                    <UserCheckIcon className="size-3" />
                    Active Account
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[11px] h-5 rounded-full px-2 py-0 font-medium border-border/70 text-muted-foreground gap-1"
                  >
                    <ShieldIcon className="size-3" />
                    Personal
                  </Badge>
                </div>
              </div>

              <p className="text-xs font-mono text-muted-foreground">
                {user.email}
              </p>

              <div className="pt-1 flex items-center justify-center sm:justify-start gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 text-[11px] bg-muted/60 px-2.5 py-0.5 rounded-md">
                  <SparklesIcon className="size-3 text-primary" />
                  Click photo to change avatar
                </span>
                {user.defaultProjectId && (
                  <span className="hidden md:inline-flex items-center gap-1 text-[11px] bg-muted/40 px-2 py-0.5 rounded-md">
                    <FolderIcon className="size-3 text-muted-foreground" />
                    Workspace configured
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Profile Form Section */}
      <UserProfileForm user={user} />
    </div>
  );
}