import { apiClient } from '@/lib/api-client';
import type { UpdateUserDto, UserResponseDto } from "@todo/shared"

export const userService = {
  async getUserProfile() {
    return apiClient.get<UserResponseDto>('/users/profile');
  },

  async updateUserProfile(userProfileDto: UpdateUserDto) {
    return apiClient.patch<UserResponseDto>(`/users/me`, userProfileDto);
  }
};