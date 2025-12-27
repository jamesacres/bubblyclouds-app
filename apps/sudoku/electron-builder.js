const { APP_CONFIG } = require('./app.config');

module.exports = {
  electronVersion: require('electron/package.json').version,
  appId: APP_CONFIG.appId,
  productName: APP_CONFIG.appName,
  copyright: 'Copyright (c) 2024 James Acres',
  win: {
    target: ['dir', 'portable', 'zip'],
    icon: 'resources/icon.ico',
  },
  linux: {
    target: ['dir', 'appimage', 'zip'],
    icon: 'resources/icon.png',
  },
  mac: {
    target: ['dir', 'dmg', 'zip'],
    icon: 'resources/icon.icns',
    extendInfo: APP_CONFIG.appId,
  },
  protocols: {
    name: APP_CONFIG.appId,
    schemes: [APP_CONFIG.appId],
  },
};
