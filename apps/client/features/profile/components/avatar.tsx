"use client";

import * as React from "react";
import { useState } from "react";
import Image from "next/image";
import { CameraIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AvatarUploadDialog } from "./avatar-upload-dialog";

export interface AvatarProps {
  avatarUrl?: string | undefined;
  name?: string;
  onAvatarUpdated?: (url: string) => void;
  className?: string;
}

export default function Avatar({
  avatarUrl,
  name,
  onAvatarUpdated,
  className,
}: AvatarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          "group relative rounded-full p-1 border-2 border-border/70 hover:border-primary/80 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/40 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md shrink-0 bg-background",
          className
        )}
        aria-label="Change profile photo"
      >
        <div className="relative size-20 md:size-24 rounded-full overflow-hidden bg-muted">
          <Image
            fill
            sizes="(max-width: 768px) 80px, 96px"
            src={avatarUrl || "/default-avatar.svg"}
            alt={name ? `${name}'s avatar` : "User Avatar"}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized={!avatarUrl?.includes("res.cloudinary.com")}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
            <CameraIcon className="size-5" />
          </div>
        </div>
      </button>

      <AvatarUploadDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        currentAvatarUrl={avatarUrl}
        onAvatarUpdated={onAvatarUpdated}
      />
    </>
  );
}