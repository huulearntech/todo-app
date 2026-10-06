"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import type { UserResponseDto, SignInDto } from "@todo/shared";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: UserResponseDto | null;
  isLoading: boolean;
  signIn: ({ email, password }: { email: string; password: string }) => Promise<UserResponseDto>;
  signOut: () => void;
  setUser: React.Dispatch<React.SetStateAction<UserResponseDto | null>>;
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

  const signIn = async (signInDto: SignInDto): Promise<UserResponseDto> => {
    try {
      setIsLoading(true);
      const authenticatedUser = await authService.signIn(signInDto);
      setUser(authenticatedUser);
      return authenticatedUser;
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut, setUser }}>
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