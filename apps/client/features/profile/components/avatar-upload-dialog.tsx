"use client";

import * as React from "react";
import { useState, useRef } from "react";
import Image from "next/image";
import { userService } from "@/features/profile/services/user.service";
import { imageUploadService } from "@/features/profile/services/image-upload.service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { CameraIcon, Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AvatarUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatarUrl?: string;
  onAvatarUpdated?: (url: string) => void;
}

export function AvatarUploadDialog({
  open,
  onOpenChange,
  currentAvatarUrl,
  onAvatarUpdated,
}: AvatarUploadDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate image format
    if (!file.type.startsWith("image/")) {
      toast.add({
        title: "Invalid file type",
        description: "Please select an image file (PNG, JPG, WEBP, GIF).",
        type: "error",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.add({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        type: "error",
      });
      return;
    }

    try {
      setIsUploading(true);
      const uploaded = await imageUploadService.uploadSingleImageDirect(file);

      const newUrl = uploaded.secure_url;

      // Persist avatar change to backend
      await userService.updateUserProfile({ avatarUrl: newUrl });

      onAvatarUpdated?.(newUrl);

      toast.add({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully!",
        type: "success",
      });
    } catch {
      toast.add({
        title: "Upload failed",
        description: "Could not upload your avatar. Please try again.",
        type: "error",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader className="text-center sm:text-left space-y-1">
          <DialogTitle className="text-lg font-semibold tracking-tight">
            Change Profile Picture
          </DialogTitle>
          <DialogDescription className="sr-only">
            Select an image to update your profile photo.
          </DialogDescription>
        </DialogHeader>

        {/* Hoverable Avatar with Camera Overlay */}
        <div className="flex flex-col items-center justify-center py-4">
          <div
            role="button"
            tabIndex={0}
            aria-label="Click to select and upload new profile picture"
            onClick={() => !isUploading && fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (!isUploading && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            className={cn(
              "group relative size-56 sm:size-64 rounded-full overflow-hidden border-4 border-border/80 hover:border-primary transition-all duration-300 shadow-lg cursor-pointer select-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
              isUploading && "pointer-events-none"
            )}
          >
            <Image
              fill
              sizes="(max-width: 640px) 224px, 256px"
              src={currentAvatarUrl || "/default-avatar.svg"}
              alt="Avatar preview"
              className={cn(
                "object-cover transition-transform duration-300 group-hover:scale-105",
                isUploading && "opacity-40 blur-[1px]"
              )}
              unoptimized={!currentAvatarUrl?.includes("res.cloudinary.com")}
            />

            {/* Hover overlay with Camera Icon */}
            <div
              className={cn(
                "absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 text-white transition-all duration-200",
                isUploading
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
              )}
            >
              {isUploading ? (
                <>
                  <Loader2Icon className="size-8 animate-spin text-white" />
                  <span className="text-xs font-medium tracking-wide">
                    Uploading photo...
                  </span>
                </>
              ) : (
                <>
                  <div className="p-3 rounded-full bg-white/20 ring-1 ring-white/40 shadow-xs transition-transform duration-200 group-hover:scale-110">
                    <CameraIcon className="size-7 text-white" />
                  </div>
                  <span className="text-xs font-semibold tracking-wider uppercase">
                    Upload Photo
                  </span>
                  <span className="text-[11px] text-white/80">Click to browse</span>
                </>
              )}
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={isUploading}
            onChange={handleFileChange}
          />
        </div>

        {/* Dialog Footer */}
        <DialogFooter className="flex-col sm:flex-row sm:justify-between items-center gap-3 pt-3 border-t border-border/40">
          <span className="text-[11px] text-muted-foreground text-center sm:text-left">
            Supports JPG, PNG, WEBP up to 5MB.
          </span>
          <DialogClose
            render={
              <Button
                variant="outline"
                size="sm"
                disabled={isUploading}
                className="rounded-xl h-8 px-4 text-xs font-medium"
              >
                Done
              </Button>
            }
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
