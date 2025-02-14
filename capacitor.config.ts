import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.logday.app',
  appName: 'Logday',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: ['*'],
    hostname: 'app'
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    limitsNavigationsToAppBoundDomains: false,
    handleApplicationNotifications: true,
    backgroundColor: '#FFFFFF',
    statusBarStyle: 'dark',
    overrideUserInterfaceStyle: 'light',
    scheme: 'app',
    webViewSuspended: false,
    marginTopNav: true,
    scrollEnabled: true,
    allowsLinkPreview: false,
    windowsAndroidOverlay: true,
    hideNavigationOnScroll: false
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    initialFocus: true
  }
};

export default config;
