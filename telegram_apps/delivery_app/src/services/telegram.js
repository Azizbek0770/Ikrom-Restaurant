import {
  initInitData,
  initMiniApp,
  initThemeParams,
  initViewport,
  initBackButton,
  initMainButton,
  initHapticFeedback
} from '@telegram-apps/sdk';

class TelegramService {
  constructor() {
    this.isInitialized = false;
    this.user = null;
    // SDK instance placeholders
    this.initData = null;
    this.miniApp = null;
    this.themeParams = null;
    this.viewport = null;
    this.backButton = null;
    this.mainButton = null;
    this.hapticFeedback = null;
  }

  // Initialize the Telegram SDK using the initializer factories
  init() {
    try {
      // Dev/test fallback: allow forcing a mocked Telegram user when running outside the Telegram WebApp
      const forceMock = import.meta.env.VITE_TG_FORCE_MOCK === 'true';
      const globalMock = typeof window !== 'undefined' ? window.__TG_MOCK_USER__ : null;
      const storageMock = typeof localStorage !== 'undefined' ? localStorage.getItem('TG_MOCK_USER') : null;

      if (forceMock || globalMock || storageMock || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))) {
        const parsed = globalMock || (storageMock ? JSON.parse(storageMock) : null) || {
          id: 'dev-user-1',
          firstName: 'Dev',
          lastName: 'User',
          username: 'dev_user',
          photoUrl: null
        };

        this.user = parsed;
        this.isInitialized = true;
        console.warn('Using mocked Telegram user for development:', this.user);
        return;
      }

      this.initData = typeof initInitData === 'function' ? initInitData() : null;
      this.miniApp = typeof initMiniApp === 'function' ? initMiniApp() : null;
      this.themeParams = typeof initThemeParams === 'function' ? initThemeParams() : null;
      this.viewport = typeof initViewport === 'function' ? initViewport() : null;
      this.backButton = typeof initBackButton === 'function' ? initBackButton() : null;
      this.mainButton = typeof initMainButton === 'function' ? initMainButton() : null;
      this.hapticFeedback = typeof initHapticFeedback === 'function' ? initHapticFeedback() : null;

      if (this.initData && typeof this.initData.restore === 'function') this.initData.restore();
      if (this.miniApp && typeof this.miniApp.ready === 'function') this.miniApp.ready();
      if (this.viewport && typeof this.viewport.expand === 'function') this.viewport.expand();

      this.isInitialized = true;

      // Defensive user extraction
      try {
        if (this.initData) {
          if (typeof this.initData.raw === 'function') {
            const raw = this.initData.raw();
            if (raw && typeof this.initData.user === 'function') {
              this.user = this.initData.user();
            }
          } else if (typeof this.initData.user === 'function') {
            this.user = this.initData.user();
          } else if (this.initData.user) {
            this.user = this.initData.user;
          }
        }
      } catch (err) {
        console.warn('Telegram initData user extraction failed:', err);
      }

      this.applyTheme();

      console.log('✅ Telegram SDK initialized', this.user);
    } catch (error) {
      console.error('❌ Failed to initialize Telegram SDK:', error);
    }
  }

  applyTheme() {
    try {
      const theme = this.themeParams && typeof this.themeParams.get === 'function' ? this.themeParams.get() : (this.themeParams || {});
      document.documentElement.style.setProperty('--tg-theme-bg-color', theme.bgColor || '#ffffff');
      document.documentElement.style.setProperty('--tg-theme-text-color', theme.textColor || '#000000');
      document.documentElement.style.setProperty('--tg-theme-hint-color', theme.hintColor || '#999999');
      document.documentElement.style.setProperty('--tg-theme-link-color', theme.linkColor || '#2481cc');
      document.documentElement.style.setProperty('--tg-theme-button-color', theme.buttonColor || '#2481cc');
      document.documentElement.style.setProperty('--tg-theme-button-text-color', theme.buttonTextColor || '#ffffff');
    } catch (error) {
      console.error('Theme application error:', error);
    }
  }

  getUser() {
    return this.user;
  }

  showBackButton(onClick) {
    if (!this.backButton) {
      console.warn('Back button is not available in the SDK.');
      return;
    }

    try {
      if (typeof this.backButton.show === 'function') this.backButton.show();
      if (typeof this.backButton.on === 'function') this.backButton.on('click', onClick);
    } catch (error) {
      console.error('Back button error:', error);
    }
  }

  hideBackButton() {
    if (!this.backButton) return;
    try {
      if (typeof this.backButton.hide === 'function') this.backButton.hide();
    } catch (error) {
      console.error('Hide back button error:', error);
    }
  }

  showMainButton(text, onClick) {
    try {
      if (!this.mainButton) throw new Error('MainButton not initialized');
      if (typeof this.mainButton.setText === 'function') this.mainButton.setText(text);
      if (typeof this.mainButton.show === 'function') this.mainButton.show();
      if (typeof this.mainButton.enable === 'function') this.mainButton.enable();
      if (typeof this.mainButton.on === 'function') this.mainButton.on('click', onClick);
    } catch (error) {
      console.error('Main button error:', error);
    }
  }

  hideMainButton() {
    try {
      if (this.mainButton && typeof this.mainButton.hide === 'function') this.mainButton.hide();
    } catch (error) {
      console.error('Hide main button error:', error);
    }
  }

  setMainButtonLoading(loading) {
    try {
      if (!this.mainButton) return;
      if (loading) {
        if (typeof this.mainButton.showLoader === 'function') this.mainButton.showLoader();
        if (typeof this.mainButton.showProgress === 'function') this.mainButton.showProgress();
      } else {
        if (typeof this.mainButton.hideLoader === 'function') this.mainButton.hideLoader();
        if (typeof this.mainButton.hideProgress === 'function') this.mainButton.hideProgress();
      }
    } catch (error) {
      console.error('Main button loading error:', error);
    }
  }

  hapticImpact(style = 'medium') {
    try {
      if (this.hapticFeedback && typeof this.hapticFeedback.impactOccurred === 'function') this.hapticFeedback.impactOccurred(style);
    } catch (error) {
      console.error('Haptic feedback error:', error);
    }
  }

  hapticNotification(type = 'success') {
    try {
      if (this.hapticFeedback && typeof this.hapticFeedback.notificationOccurred === 'function') this.hapticFeedback.notificationOccurred(type);
    } catch (error) {
      console.error('Haptic notification error:', error);
    }
  }

  close() {
    try {
      if (this.miniApp && typeof this.miniApp.close === 'function') this.miniApp.close();
    } catch (error) {
      console.error('Close app error:', error);
    }
  }

  openLink(url) {
    try {
      if (this.miniApp && typeof this.miniApp.openLink === 'function') this.miniApp.openLink(url);
    } catch (error) {
      console.error('Open link error:', error);
    }
  }

  openTelegramLink(url) {
    try {
      if (this.miniApp && typeof this.miniApp.openTelegramLink === 'function') this.miniApp.openTelegramLink(url);
    } catch (error) {
      console.error('Open Telegram link error:', error);
    }
  }
}

const telegramService = new TelegramService();
export default telegramService;