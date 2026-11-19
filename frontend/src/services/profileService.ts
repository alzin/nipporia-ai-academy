import api from './api';

// Only the display name is kept (shown in the header).
export interface Profile {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileData {
  name?: string;
}

export const profileService = {
  async getMyProfile(): Promise<Profile> {
    const response = await api.get('/profile/me');
    return response.data;
  },

  async updateProfile(data: UpdateProfileData): Promise<Profile> {
    const response = await api.put('/profile/me', data);
    return response.data;
  },
};
