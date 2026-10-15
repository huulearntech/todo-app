import { apiClient } from "@/lib/api-client";

import type {
  SignUpDto,
  UserResponseDto,
  VerificationStatusResponseDto,
  ChangePasswordDto,
} from "@todo/shared";

export interface SignUpResponse {
  user: UserResponseDto;
}

export const authService = {
  async signUp(signUpDto: SignUpDto): Promise<SignUpResponse> {
    const response = await apiClient.post<SignUpResponse>("/auth/sign-up", signUpDto);
    return response.data;
  },

  async signOut() {
    await apiClient.post("/auth/sign-out");
  },

  async getVerificationStatus(
    userId: string,
  ): Promise<VerificationStatusResponseDto> {
    const response = await apiClient.get<VerificationStatusResponseDto>(
      "/auth/verification-status",
      { params: { userId } },
    );
    return response.data;
  },

  async resendVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      "/auth/magic-link",
      { email },
    );
    return response.data;
  },

  async getCurrentUser() {
    const response = await apiClient.get<UserResponseDto>("/auth/me");
    return response.data;
  },

  async changePassword(dto: ChangePasswordDto): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      "/auth/change-password",
      dto,
    );
    return response.data;
  },
};