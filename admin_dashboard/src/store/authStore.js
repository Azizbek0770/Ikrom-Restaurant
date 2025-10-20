import { create } from 'zustand';
import { authAPI } from '@/services/api';
import { initSocket, disconnectSocket } from '@/services/socket';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { user, accessToken, refreshToken } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      set({ user, isAuthenticated: true });
      initSocket(user.id);

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  },

  logout: async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      disconnectSocket();
      set({ user: null, isAuthenticated: false });
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
      initSocket(user.id);
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateUser: (userData) => {
    set((state) => ({
      user: { ...state.user, ...userData }
    }));
  }
}));

export default useAuthStore;