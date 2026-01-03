import type { CapacitorConfig } from '@capacitor/cli';
import { APP_CONFIG } from './app.config.js';

const config: CapacitorConfig = {
  appId: APP_CONFIG.appId,
  appName: APP_CONFIG.appName,
  webDir: 'out',
  plugins: {
    Keyboard: {
      resizeOnFullScreen: true,
    },
  },
};

export default config;
