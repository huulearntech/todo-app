import { apiClient } from "@/lib/api-client";

import { CreateUserResDto } from "@/types/user.type";
import { type SignUpDto } from "@todo/shared";


export const authService = {
  async signUp(signUpDto: SignUpDto) {
    const response = await apiClient.post<CreateUserResDto>("/auth/sign-up", signUpDto);
    return response.data;
  },

  async signIn(signInUserDto: { email: string; password: string }) {
    const response = await apiClient.post<CreateUserResDto>("/auth/sign-in", signInUserDto);
    return response.data;
  },

  async signOut() {
    await apiClient.post("/auth/sign-out");
  },

  async getCurrentUser() {
    const response = await apiClient.get<CreateUserResDto>("/auth/me");
    return response.data;
  },
};