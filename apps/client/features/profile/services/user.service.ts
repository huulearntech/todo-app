import { apiClient } from '@/lib/api-client';
import type { UpdateUserDto, UserResponseDto } from "@todo/shared"

export const userService = {
  async updateUserProfile(userProfileDto: UpdateUserDto) {
    return apiClient.patch<UserResponseDto>(`/users/me`, userProfileDto);
  }
};