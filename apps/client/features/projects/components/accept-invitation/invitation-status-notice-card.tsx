"use client";

import React from "react";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface InvitationStatusNoticeCardProps {
  icon: React.ComponentType<{ className?: string }>;
  iconContainerClassName: string;
  title: string;
  description: React.ReactNode;
  action?: {
    label: string;
    href: string;
    variant?: "default" | "outline";
    icon?: React.ComponentType<{ className?: string }>;
  };
}

export function InvitationStatusNoticeCard({
  icon: Icon,
  iconContainerClassName,
  title,
  description,
  action,
}: InvitationStatusNoticeCardProps) {
  const ActionIcon = action?.icon ?? ArrowRightIcon;

  return (
    <Card className="w-full shadow-lg border border-border/80">
      <CardHeader className="text-center space-y-2">
        <div
          className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2 ${iconContainerClassName}`}
        >
          <Icon className="w-6 h-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          {title}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>
      {action && (
        <CardContent className="flex flex-col items-center">
          <Button
            variant={action.variant ?? "outline"}
            className="w-full py-5 text-sm font-medium gap-2 cursor-pointer"
            render={<Link href={action.href} />}
            nativeButton={false}
          >
            <span>{action.label}</span>
            <ActionIcon className="w-4 h-4" />
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
