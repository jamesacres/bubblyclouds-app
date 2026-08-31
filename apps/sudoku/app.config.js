const APP = 'sudoku';
const APP_NAME = 'Sudoku Race';
const GAME_NAME = 'Sudoku';
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
  appDescription: 'Play and share to race sudoku with friends. Daily challenges & cross-device!',
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
  mobileDescription: `Get the best racing experience with our ${APP_NAME} app!`,
  desktopDescription: `Download ${APP_NAME}`,
  openInAppLabel: 'Open Puzzle',
  revenueCatApiKeys: {
    ios: 'appl_cSnwNkaTjlVONbHuKzVNTRjQsbT',
    android: 'goog_NrLMlLbrRvQVKxXifUHmJBkSOXr',
    web: 'rcb_ZoFwJlmCeBHaoVZNPhCiUqLXRAhf',
  },
};

module.exports = { APP_CONFIG };
