import { apiClient } from "@/lib/api-client";

import { CreateUserResDto } from "@/types/user.type";
import { type SignUpDto } from "@todo/shared";

type RefreshTokenResDto = {
  accessToken: string;
};

// TODO: Consistency between URLs @Robustness
export const authService = {
  async register(signUpDto: SignUpDto) {
    const response = await apiClient.post<CreateUserResDto>("/users", signUpDto);
    return response.data;
  },

  async signIn(signInUserDto: { email: string; password: string }) {
    const response = await apiClient.post<{ accessToken: string; user: {
      id: string;
      email: string;
      name: string;
      defaultProjectId: string;
    }}>("/auth/sign-in", signInUserDto);

    return response.data;
  },

  async signOut() {
    await apiClient.post("/auth/sign-out");
  },

  async refreshToken() {
    const response = await apiClient.post<RefreshTokenResDto>("/auth/refresh-token");
    return response.data; // NOTE: this does not do anything yet
  },
};