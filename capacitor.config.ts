import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.prestamoplus.app',
  appName: 'PréstamoPlus',
  webDir: 'dist',
  android: {
    backgroundColor: '#071b2e',
  },
  ios: {
    contentInset: 'automatic',
  },
};

export default config;
