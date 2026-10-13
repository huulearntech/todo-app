import { apiClient } from "@/lib/api-client";

import type { SignUpDto, UserResponseDto } from "@todo/shared";


export const authService = {
  async signUp(signUpDto: SignUpDto) {
    const response = await apiClient.post<UserResponseDto>("/auth/sign-up", signUpDto);
    return response.data;
  },

  async signIn(signInUserDto: { email: string; password: string }) {
    const response = await apiClient.post<UserResponseDto>("/auth/sign-in", signInUserDto);
    return response.data;
  },

  async signOut() {
    await apiClient.post("/auth/sign-out");
  },

  async verifyMagicLink(token: string) {
    const response = await apiClient.post<{ user: UserResponseDto }>(
      "/auth/magic-link/verify",
      { token },
    );
    return response.data;
  },

  async getCurrentUser() {
    const response = await apiClient.get<UserResponseDto>("/auth/me");
    return response.data;
  },
};