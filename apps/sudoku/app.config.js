const { brand } = require('./src/locales/en.json');

for (const key of ['appName', 'gameName', 'companyName']) {
  if (!brand?.[key]) {
    throw new Error(`Missing brand.${key} in src/locales/en.json`);
  }
}

const APP = 'sudoku';
const APP_NAME = brand.appName;
const GAME_NAME = brand.gameName;
const DOMAIN = 'bubblyclouds.com';
const REVERSE_DOMAIN = 'com.bubblyclouds';
const COMPANY_NAME = brand.companyName;
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
  gameName: GAME_NAME,
  appId: `${REVERSE_DOMAIN}.${APP}`,
  appUrl: `https://${APP}.${DOMAIN}`,
  apiUrl: `https://api.${DOMAIN}`,
  authUrl: `https://auth.${DOMAIN}`,
  companyUrl: `https://${DOMAIN}`,
  companyName: COMPANY_NAME,
  feedbackEmail: 'james@bubblyclouds.com',
  privacyUrl: `https://${DOMAIN}/privacy`,
  termsUrl: `https://${DOMAIN}/terms`,
  creditsUrl: '/credits',
  appStoreUrl: 'https://apps.apple.com/app/sudoku-race/id6517357180',
  googlePlayUrl:
    'https://play.google.com/store/apps/details?id=com.bubblyclouds.sudoku',
  googlePlayBetaUrl: `https://play.google.com/apps/testing/${REVERSE_DOMAIN}.${APP}`,
  testFlightUrl: 'https://testflight.apple.com/join/QMjDmYHu',
  testersGroupUrl: `https://groups.google.com/a/${DOMAIN}/g/testers`,
  deepLinkScheme: `${REVERSE_DOMAIN}.${APP}`,
  revenueCatApiKeys: {
    ios: 'appl_cSnwNkaTjlVONbHuKzVNTRjQsbT',
    android: 'goog_NrLMlLbrRvQVKxXifUHmJBkSOXr',
    web: 'rcb_ZoFwJlmCeBHaoVZNPhCiUqLXRAhf',
  },
};

const CROSS_PROMO = {
  appUrl: `https://unblockrace.${DOMAIN}`,
  appStoreUrl: 'https://apps.apple.com/app/unblock-race/id6799411805',
  googlePlayUrl: `https://play.google.com/store/apps/details?id=${REVERSE_DOMAIN}.unblockrace`,
};

module.exports = { APP_CONFIG, CROSS_PROMO };
