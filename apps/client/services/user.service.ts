import { apiClient } from '@/lib/api-client';
import { User } from '@/types/user.type';

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

  async updateUserProfile(profileData: Partial<User>) {
    try {
      console.log(profileData);
      const response = await apiClient.patch<User>(`/users/me`, profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },
};