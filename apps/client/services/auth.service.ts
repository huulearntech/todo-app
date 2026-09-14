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

  async login(loginUserDto: { email: string; password: string }) {
    const response = await apiClient.post<{ accessToken: string; user: {
      id: string;
      email: string;
      name: string;
    }}>("/auth/sign-in", loginUserDto);

    authSession.setAccessToken(response.data.accessToken);
    return response.data;
  },

  async logout() {
    authSession.clear();
    const response = await apiClient.post("/auth/logout");
    return response.data;
  },

  async refreshToken() {
    const response = await apiClient.post<RefreshTokenResDto>("/auth/refresh-token");
    authSession.setAccessToken(response.data.accessToken);
    return response.data;
  },
};