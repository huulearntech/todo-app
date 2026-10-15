"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import UserProfileForm from "@/features/profile/components/user-profile-form";
import ChangePasswordCard from "@/features/profile/components/change-password-card";
import { AppearanceSkeleton } from "@/features/profile/components/appearance-settings";
import { useAuth } from "@/providers/AuthProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogInIcon } from "lucide-react";

const AppearanceSettings = dynamic(
  () => import("@/features/profile/components/appearance-settings"),
  {
    ssr: false,
    loading: () => <AppearanceSkeleton />,
  }
);

export default function ProfilePage() {
  const { user, isLoading } = useAuth();

  // Skeleton loading state
  if (isLoading) {
    return (
      <div className="section-stack animate-pulse">
        {/* Header Skeleton */}
        <div className="page-header-row">
          <div className="space-y-2">
            <Skeleton className="h-8 w-44 rounded-lg" />
            <Skeleton className="h-4 w-72 rounded-md" />
          </div>
        </div>

        {/* Profile Card Skeleton (Responsive flex) */}
        <Card className="rounded-2xl border border-border/60 p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
            <Skeleton className="size-20 md:size-24 rounded-full shrink-0" />
            <div className="flex-1 w-full space-y-4 pt-1">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-20 rounded-md" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </Card>

        {/* Appearance Card Skeleton */}
        <AppearanceSkeleton />
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
        <p className="text-sm text-muted-foreground mt-1.5 mb-6 max-w-xs mx-auto leading-relaxed">
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
    <div className="section-stack">
      {/* Page Title & Description */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">
            Profile
          </h1>
          <p className="page-subtitle">
            Manage your personal details and app preferences.
          </p>
        </div>
      </div>

      {/* Unified Profile Form Section */}
      <UserProfileForm user={user} />

      {/* Security & Password Section */}
      <ChangePasswordCard />

      {/* Appearance & Theme Section */}
      <AppearanceSettings />
    </div>
  );
}