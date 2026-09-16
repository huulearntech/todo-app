"use client";

import { useState } from "react";
import { userService } from "@/services/user.service";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import Image from "next/image";
import { imageUploadService } from "@/services/image-upload.service";

// TODO: signed uploading avatar to cloudinary. also handle state
export default function Avatar({ avatarUrl }: { avatarUrl?: string | undefined }) {
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | undefined>(avatarUrl);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const [uploadedUrl] = await imageUploadService.uploadMultipleImagesDirect([file], 'avatars');
        setCurrentAvatarUrl(uploadedUrl.secure_url);

        // FIX: This need to be webhook on the server side.
        // The following code is just for demonstration purposes and should not be used in production.
        // Update the user's avatar URL in the backend
        await userService.updateUserProfile({ avatarUrl: uploadedUrl.secure_url });

      } catch (error) {
        console.error("Error uploading avatar:", error);
      }
    }
  };

  // TODO: add validation for file type and size
  return (
    <Dialog>
      <DialogTrigger render={
        <button className="rounded-full border-2 border-gray-300 p-1">
          <Image
            width={48}
            height={48}
            src={currentAvatarUrl || '/default-avatar.svg'}
            alt="User Avatar"
            className="h-12 w-12 rounded-full"
          />
        </button>
      } />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Avatar</DialogTitle>
          <DialogDescription>
            Choose a file to upload as your avatar.
          </DialogDescription>
        </DialogHeader>

        <Image
          width={48}
          height={48}
          src={currentAvatarUrl || '/default-avatar.svg'}
          alt="User Avatar"
          className="size-60 rounded-full"
        />
       

        <DialogFooter>
          <input type="file" accept="image/*" onChange={handleFileChange} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}