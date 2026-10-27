"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/features/auth/services/auth.service";
import type { UserResponseDto } from "@todo/shared";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: UserResponseDto | null;
  isLoading: boolean;
  signOut: () => void;
  setUser: React.Dispatch<React.SetStateAction<UserResponseDto | null>>;
  updateUser: (updatedUser: Partial<UserResponseDto>) => void;
}

interface AuthProviderProps {
  children: React.ReactNode;
  initialUser?: UserResponseDto | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [user, setUser] = useState<UserResponseDto | null>(initialUser ?? null);
  const [isLoading, setIsLoading] = useState<boolean>(initialUser === undefined);
  const [prevInitialUser, setPrevInitialUser] = useState(initialUser);

  if (initialUser !== prevInitialUser) {
    setPrevInitialUser(initialUser);
    setUser(initialUser ?? null);
    setIsLoading(false);
  }

  useEffect(() => {
    if (initialUser !== undefined) {
      return;
    }

    let isMounted = true;
    const fetchCurrentUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (isMounted) {
          setUser(currentUser);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchCurrentUser();

    return () => {
      isMounted = false;
    };
  }, [initialUser]);

  const signOut = async () => {
    try {
      setIsLoading(true);
      await authService.signOut();
      setUser(null);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
      queryClient.clear();
      router.push("/");
      router.refresh();
    }
  };

  const updateUser = useCallback(
    (updated: Partial<UserResponseDto>) => {
      setUser((prev) => (prev ? { ...prev, ...updated } : null));
      router.refresh();
    },
    [router]
  );

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut, setUser, updateUser }}>
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