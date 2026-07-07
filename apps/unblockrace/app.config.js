const APP = 'unblockrace';
const APP_NAME = 'Unblock Race';
const GAME_NAME = 'Unblock Race';
const DOMAIN = 'bubblyclouds.com';
const REVERSE_DOMAIN = 'com.bubblyclouds';
const COMPANY_NAME = 'Bubbly Clouds';
const APP_CONFIG = {
  app: APP,
  scope: [
    'openid',
    'profile',
    'offline_access',
    'parties.write',
    'members.write',
    'invites.write',
    'sessions.write',
  ],
  appName: APP_NAME,
  appDescription:
    'Play and share to race friends to unblock the puzzle. Daily challenges & cross-device!',
  gameName: GAME_NAME,
  appId: `${REVERSE_DOMAIN}.${APP}`,
  appUrl: `https://${APP}.${DOMAIN}`,
  apiUrl: `https://api.${DOMAIN}`,
  authUrl: `https://auth.${DOMAIN}`,
  companyUrl: `https://${DOMAIN}`,
  companyName: COMPANY_NAME,
  privacyUrl: `https://${DOMAIN}/privacy`,
  termsUrl: `https://${DOMAIN}/terms`,
  creditsUrl: '/credits',
  // TODO
  appStoreUrl: 'https://apps.apple.com/app/unblock-race/idTODO',
  googlePlayUrl:
    'https://play.google.com/store/apps/details?id=com.bubblyclouds.unblockrace',
  deepLinkScheme: `${REVERSE_DOMAIN}.${APP}`,
  mobileDescription: `Get the best experience with our ${APP_NAME} app!`,
  desktopDescription: `Download ${APP_NAME}`,
  openInAppLabel: 'Open Puzzle',
  // TODO: create an Unblock Race app in RevenueCat and set its API keys here
  revenueCatApiKeys: {
    ios: 'TODO',
    android: 'TODO',
    web: 'TODO',
  },
};

module.exports = { APP_CONFIG };
