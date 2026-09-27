"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { authService } from "@/services/auth.service";
import type { UserResponseDto, SignInDto } from "@todo/shared";
import { useQueryClient } from "@tanstack/react-query";

type AuthContextType = {
  user: UserResponseDto | null;
  isLoading: boolean;
  signIn: ({ email, password } : { email: string, password: string }) => Promise<void>;
  signOut: () => void;
};


export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const [user, setUser] = useState<UserResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);
  

  const signIn = async (signInDto: SignInDto) => {
    try {
      setIsLoading(true);
      const user = await authService.signIn(signInDto);
      setUser(user);
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  const signOut = async () => {
    try {
      setIsLoading(true);
      await authService.signOut();
      setUser(null);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
      queryClient.clear(); // Clear the query cache on sign out
    }
  }


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