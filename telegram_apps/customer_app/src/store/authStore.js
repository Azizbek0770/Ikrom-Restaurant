import { create } from 'zustand';
import { authAPI } from '@/services/api';
import telegramService from '@/services/telegram';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  authenticate: async () => {
    try {
      const tgUser = telegramService.getUser();
      
      if (!tgUser) {
        throw new Error('No Telegram user data');
      }

      const response = await authAPI.telegram({
        telegram_id: tgUser.id,
        first_name: tgUser.firstName,
        last_name: tgUser.lastName,
        username: tgUser.username,
        photo_url: tgUser.photoUrl
      });

      const { user, accessToken, refreshToken } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      set({ user, isAuthenticated: true, isLoading: false });
      
      return { success: true };
    } catch (error) {
      console.error('Authentication error:', error);
      set({ isLoading: false });
      return { success: false, error: error.message };
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      set({ isLoading: false });
      return;
    }

    try {
      const response = await authAPI.getCurrentUser();
      const user = response.data.data.user;
      
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  }
}));

export default useAuthStore;