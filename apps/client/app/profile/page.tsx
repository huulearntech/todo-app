"use client";

import Avatar from "@/components/profile/avatar";
import UserProfileForm from "@/components/profile/user-profile-form";
import { useAuth } from "@/providers/AuthProvider";


export default function ProfilePage() { // TODO: Not on client side.
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-y-2 py-4">
      {user ? (
        <>
          <Avatar avatarUrl={user.avatarUrl ?? undefined} />
          <UserProfileForm user={user} />
        </>
      ) : (
        <p>Loading user profile...</p>
      )}
    </div>
  );
}