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

      // Verify user is a delivery partner
      if (user.role !== 'delivery') {
        throw new Error('Access denied. Delivery partner account required.');
      }

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
      // If running locally in dev and no token, auto-create/use demo delivery user for easier local dev
      if (import.meta.env.DEV) {
        try {
          const demoEmail = import.meta.env.VITE_DEMO_DELIVERY_EMAIL || 'demo_delivery@example.com';
          const demoPassword = import.meta.env.VITE_DEMO_DELIVERY_PASSWORD || 'demopass123';

          // Try login
          try {
            const res = await authAPI.login({ email: demoEmail, password: demoPassword });
            const { accessToken, refreshToken } = res.data.data;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
          } catch (loginErr) {
            // If login failed, try register then login. If register returns 409 (race condition), retry login.
            const status = loginErr.response?.status;

            if ([401, 404, 400, 409].includes(status) || !status) {
              try {
                await authAPI.register({ email: demoEmail, password: demoPassword, first_name: 'Demo', role: 'delivery' });
                const res2 = await authAPI.login({ email: demoEmail, password: demoPassword });
                const { accessToken, refreshToken } = res2.data.data;
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);
              } catch (regErr) {
                // If register failed because the user already exists, try logging in again (handles race where user was created elsewhere)
                if (regErr.response && regErr.response.status === 409) {
                  try {
                    const retryRes = await authAPI.login({ email: demoEmail, password: demoPassword });
                    const { accessToken, refreshToken } = retryRes.data.data;
                    localStorage.setItem('accessToken', accessToken);
                    localStorage.setItem('refreshToken', refreshToken);
                  } catch (finalLoginErr) {
                    console.error('Demo final login failed after register conflict', finalLoginErr);
                    set({ isLoading: false });
                    return;
                  }
                } else {
                  console.error('Demo register/login failed', regErr);
                  set({ isLoading: false });
                  return;
                }
              }
            } else {
              console.error('Demo login failed', loginErr);
              set({ isLoading: false });
              return;
            }
          }

          // Fetch current user now that we have token
          const response = await authAPI.getCurrentUser();
          const user = response.data.data.user;
          if (user.role !== 'delivery') {
            console.warn('Demo user is not delivery role');
            set({ isLoading: false });
            return;
          }
          set({ user, isAuthenticated: true, isLoading: false });
          return;
        } catch (demoErr) {
          console.error('Demo auth error', demoErr);
          set({ isLoading: false });
          return;
        }
      }

      set({ isLoading: false });
      return;
    }

    try {
      const response = await authAPI.getCurrentUser();
      const user = response.data.data.user;
      
      if (user.role !== 'delivery') {
        throw new Error('Access denied');
      }
      
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  }
}));

export default useAuthStore;