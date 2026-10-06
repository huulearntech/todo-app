"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { userService } from "@/services/user.service";
import { imageUploadService } from "@/services/image-upload.service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { CameraIcon, Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | undefined>(avatarUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if external avatarUrl prop updates
  useEffect(() => {
    setCurrentAvatarUrl(avatarUrl);
  }, [avatarUrl]);

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
      const [uploadedUrl] = await imageUploadService.uploadMultipleImagesDirect(
        [file],
        "avatars"
      );

      const newUrl = uploadedUrl.secure_url;
      setCurrentAvatarUrl(newUrl);

      // Persist avatar change to backend
      await userService.updateUserProfile({ avatarUrl: newUrl });

      onAvatarUpdated?.(newUrl);

      toast.add({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully!",
        type: "success",
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* Outer Trigger on Profile Page */}
      <DialogTrigger
        render={
          <button
            type="button"
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
                src={currentAvatarUrl || "/default-avatar.svg"}
                alt={name ? `${name}'s avatar` : "User Avatar"}
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                unoptimized={!currentAvatarUrl?.includes("res.cloudinary.com")}
              />
              {/* <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <CameraIcon className="size-5" />
              </div> */}
            </div>
            {/* Edit badge */}
            {/* <div className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground shadow-xs ring-2 ring-background transition-transform group-hover:scale-110">
              <CameraIcon className="size-3.5" />
            </div> */}
          </button>
        }
      />

      {/* Upload Dialog */}
      <DialogContent className="sm:max-w-md rounded-2xl p-6">
        <DialogHeader className="text-center sm:text-left space-y-1">
          <DialogTitle className="text-lg font-semibold tracking-tight">
            Change Profile Picture
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Hover over the image and click to choose a new photo from your device.
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