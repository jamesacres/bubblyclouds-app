const APP = 'moneybagsrace';
const APP_NAME = 'Money Bags Race';
const GAME_NAME = 'Money Bags Race';
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
  appDescription: 'Race friends and family, month after month.',
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
  appStoreUrl: 'https://apps.apple.com/app/money-bags-race/idTODO',
  googlePlayUrl:
    'https://play.google.com/store/apps/details?id=com.bubblyclouds.moneybagsrace',
  deepLinkScheme: `${REVERSE_DOMAIN}.${APP}`,
  mobileDescription: `Get the best experience with our ${APP_NAME} app!`,
  desktopDescription: `Download ${APP_NAME}`,
  openInAppLabel: 'Open App',
  // TODO: create a Money Bags Race app in RevenueCat and set its API keys here
  revenueCatApiKeys: {
    ios: 'TODO',
    android: 'TODO',
    web: 'TODO',
  },
};

module.exports = { APP_CONFIG };
