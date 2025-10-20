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
    // SDK instances (initialized in init())
    this.initData = null;
    this.miniApp = null;
    this.themeParams = null;
    this.viewport = null;
    this.backButton = null;
    this.mainButton = null;
    this.hapticFeedback = null;
  }

  // Initialize the Telegram SDK
  init() {
    try {
      // Initialize SDK components (call initializer factories exported by the package)
      this.initData = typeof initInitData === 'function' ? initInitData() : null;
      this.miniApp = typeof initMiniApp === 'function' ? initMiniApp() : null;
      this.themeParams = typeof initThemeParams === 'function' ? initThemeParams() : null;
      this.viewport = typeof initViewport === 'function' ? initViewport() : null;
      this.backButton = typeof initBackButton === 'function' ? initBackButton() : null;
      this.mainButton = typeof initMainButton === 'function' ? initMainButton() : null;
      this.hapticFeedback = typeof initHapticFeedback === 'function' ? initHapticFeedback() : null;

      // Call ready/restore/expand methods if available
      if (this.initData && typeof this.initData.restore === 'function') {
        this.initData.restore();
      }

      if (this.miniApp && typeof this.miniApp.ready === 'function') {
        this.miniApp.ready();
      }

      if (this.viewport && typeof this.viewport.expand === 'function') {
        this.viewport.expand();
      }

      this.isInitialized = true;

      // Get user data (defensive checks for different SDK shapes)
      try {
        if (this.initData) {
          if (typeof this.initData.raw === 'function') {
            const initDataRaw = this.initData.raw();
            if (initDataRaw && typeof this.initData.user === 'function') {
              this.user = this.initData.user();
            }
          } else if (typeof this.initData.user === 'function') {
            this.user = this.initData.user();
          } else if (this.initData.user) {
            this.user = this.initData.user;
          }
        }
      } catch (err) {
        // ignore user extraction errors
        console.warn('Telegram initData user extraction failed:', err);
      }

      // Apply theme
      this.applyTheme();

      console.log('✅ Telegram SDK initialized', this.user);
    } catch (error) {
      console.error('❌ Failed to initialize Telegram SDK:', error);

      // If we're running in development (localhost) or a test env, allow a mocked user
      try {
        const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        const globalMock = typeof window !== 'undefined' ? window.__TG_MOCK_USER__ : null;
        const storageMock = typeof localStorage !== 'undefined' ? localStorage.getItem('TG_MOCK_USER') : null;

        if (globalMock || storageMock || isLocal) {
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
        }
      } catch (e) {
        // ignore fallback errors
      }
    }
  }

  // Developer helper to set a mock user at runtime
  setMockUser(user) {
    try {
      this.user = user;
      // persist so reloads can use it
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('TG_MOCK_USER', JSON.stringify(user));
      }
    } catch (err) {
      console.warn('setMockUser error:', err);
    }
  }

  // Apply the theme to the page
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

  // Get the current user data
  getUser() {
    return this.user;
  }

  // Show the back button with a custom onClick handler
  showBackButton(onClick) {
    // Check if backButton is available
    if (this.backButton) {
      try {
        if (typeof this.backButton.show === 'function') this.backButton.show();
        if (typeof this.backButton.on === 'function') this.backButton.on('click', onClick);
      } catch (error) {
        console.error('Back button error:', error);
      }
    } else {
      console.warn('Back button is not available in the SDK.');
    }
  }

  // Hide the back button
  hideBackButton() {
    if (this.backButton) {
      try {
        if (typeof this.backButton.hide === 'function') this.backButton.hide();
      } catch (error) {
        console.error('Hide back button error:', error);
      }
    }
  }

  // Show the main button with custom text and an onClick handler
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

  // Hide the main button
  hideMainButton() {
    try {
      if (this.mainButton && typeof this.mainButton.hide === 'function') this.mainButton.hide();
    } catch (error) {
      console.error('Hide main button error:', error);
    }
  }

  // Set the main button to loading state
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

  // Trigger haptic feedback with a style
  hapticImpact(style = 'medium') {
    try {
      if (this.hapticFeedback && typeof this.hapticFeedback.impactOccurred === 'function') this.hapticFeedback.impactOccurred(style);
    } catch (error) {
      console.error('Haptic feedback error:', error);
    }
  }

  // Trigger haptic notification with a type (e.g., success, warning)
  hapticNotification(type = 'success') {
    try {
      if (this.hapticFeedback && typeof this.hapticFeedback.notificationOccurred === 'function') this.hapticFeedback.notificationOccurred(type);
    } catch (error) {
      console.error('Haptic notification error:', error);
    }
  }

  // Close the Telegram mini-app
  close() {
    try {
      if (this.miniApp && typeof this.miniApp.close === 'function') this.miniApp.close();
    } catch (error) {
      console.error('Close app error:', error);
    }
  }

  // Open a link within the mini-app
  openLink(url) {
    try {
      if (this.miniApp && typeof this.miniApp.openLink === 'function') this.miniApp.openLink(url);
    } catch (error) {
      console.error('Open link error:', error);
    }
  }

  // Open a Telegram link within the mini-app
  openTelegramLink(url) {
    try {
      if (this.miniApp && typeof this.miniApp.openTelegramLink === 'function') this.miniApp.openTelegramLink(url);
    } catch (error) {
      console.error('Open Telegram link error:', error);
    }
  }
}

// Instantiate the TelegramService
const telegramService = new TelegramService();
export default telegramService;
