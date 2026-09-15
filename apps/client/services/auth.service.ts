import { apiClient } from "@/lib/api-client";
import { authSession } from "@/lib/auth-session";
import { CreateUserReqDto, CreateUserResDto } from "@/types/user.type";

type RefreshTokenResDto = {
  accessToken: string;
};

// TODO: Consistency between URLs @Robustness
export const authService = {
  async register(createUserDto: CreateUserReqDto) {
    const response = await apiClient.post<CreateUserResDto>("/users", createUserDto);
    return response.data;
  },

  async signIn(signInUserDto: { email: string; password: string }) {
    const response = await apiClient.post<{ accessToken: string; user: {
      id: string;
      email: string;
      name: string;
    }}>("/auth/sign-in", signInUserDto);

    authSession.setAccessToken(response.data.accessToken);
    return response.data;
  },

  async signOut() {
    authSession.clear();
    const response = await apiClient.post("/auth/sign-out");
    return response.data;
  },

  async refreshToken() {
    const response = await apiClient.post<RefreshTokenResDto>("/auth/refresh-token");
    authSession.setAccessToken(response.data.accessToken);
    return response.data;
  },
};