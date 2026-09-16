import { apiClient } from '@/lib/api-client';
import { type UserProfileDto } from "@todo/shared"

export const userService = {
  async getUserProfile() {
    try {
      const response = await apiClient.get('/users/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  async updateUserProfile(userProfileDto: UserProfileDto) {
    // TODO: how to handle error?
    await apiClient.patch(`/users/me`, userProfileDto);
  }
};