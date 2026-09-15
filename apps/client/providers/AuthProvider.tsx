"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { authService } from "@/services/auth.service";
import { type CreateUserResDto } from "@/types/user.type";

import { apiClient } from "@/lib/api-client";

type AuthContextType = {
  user: CreateUserResDto | null;
  signIn: (email: string, password: string) => Promise<CreateUserResDto>;
  signOut: () => void;
};


export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CreateUserResDto | null>(null);

  const signIn = async (email: string, password: string) => {
    const { user } = await authService.signIn({ email, password });
    setUser(user);
    return user;
  };

  const signOut = () => {
    // TODO: Can request something on backend
    console.log("Signing out user");
    setUser(null);
  };
  
  useEffect(() => {

    const bootstrapAuth = async () => {
      try {
        const { data: currentUser } = await apiClient.get<CreateUserResDto>("/auth/me");
        setUser(currentUser);
      } catch (error) {
        console.error("Failed to fetch current user:", error);
        setUser(null);
      }
    };

    bootstrapAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
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