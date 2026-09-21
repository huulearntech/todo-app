"use client";

import Avatar from "@/components/profile/avatar";
import UserProfileForm from "@/components/profile/user-profile-form";
import { useAuth } from "@/providers/AuthProvider";


export default function ProfilePage() { // NOTE: Async page is not so good @Perf
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen py-2">
      {user ? (
        <>
          <Avatar avatarUrl={user.avatarUrl} />
          <UserProfileForm user={user} />
        </>
      ) : (
        <p>Loading user profile...</p>
      )}
    </div>
  );
}