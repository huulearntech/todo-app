"use client";

import { createContext, useContext } from "react";
import { authService } from "@/services/auth.service";
import { type CreateUserResDto } from "@/types/user.type"; // TODO: clean up types @Cleanup

import { apiClient } from "@/lib/api-client";

// FIX: AuthProvider vs QueryProvider: which one should be the parent?
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type AuthContextType = {
  user: CreateUserResDto | null;
  isLoading: boolean;
  signIn: ({ email, password } : { email: string, password: string }) => Promise<CreateUserResDto>;
  signOut: () => void;
};


export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user = null, isLoading } = useQuery<CreateUserResDto | null>({
    queryKey: ["current_user"],
    queryFn: async () => {
      try {
        const { data: currentUser } = await apiClient.get<CreateUserResDto>("/auth/me");
        return currentUser;
      } catch (error) {
        console.error("Failed to fetch current user:", error);
        return null;
      }
    },
  });

  const signInMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      return authService.signIn({ email, password });
    },
    onSuccess: ({ accessToken, user }) => {
      queryClient.setQueryData(["current_user"], user);
    },
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      await authService.signOut();
    },
    onSettled: () => {
      queryClient.clear(); // Clear all queries to ensure no stale data is used after sign-out
    },
  });

  const signIn = async ({ email, password }: { email: string, password: string }) => {
    const { user } = await signInMutation.mutateAsync({ email, password });
    queryClient.setQueryData(["current_user"], user);
    return user;
  };

  const signOut = async () => {
    await signOutMutation.mutateAsync();
  };


  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};