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
  feedbackEmail: 'james@bubblyclouds.com',
  privacyUrl: `https://${DOMAIN}/privacy`,
  termsUrl: `https://${DOMAIN}/terms`,
  creditsUrl: '/credits',
  appStoreUrl: 'https://apps.apple.com/app/unblock-race/id6799411805',
  googlePlayUrl:
    'https://play.google.com/store/apps/details?id=com.bubblyclouds.unblockrace',
  googlePlayBetaUrl: `https://play.google.com/apps/testing/${REVERSE_DOMAIN}.${APP}`,
  testFlightUrl: 'https://testflight.apple.com/join/TODO',
  testersGroupUrl: `https://groups.google.com/a/${DOMAIN}/g/testers`,
  deepLinkScheme: `${REVERSE_DOMAIN}.${APP}`,
  mobileDescription: `Get the best experience with our ${APP_NAME} app!`,
  desktopDescription: `Download ${APP_NAME}`,
  openInAppLabel: 'Open Puzzle',
  revenueCatApiKeys: {
    ios: 'appl_mzpsWpSHbDcxskYqAMcRLCtLOfH',
    android: 'goog_PpQoFURGCTltCJTrkAQgwsHLaIj',
    web: 'rcb_CDdnzbxceciOovuvwvEShqStvFph',
  },
};

const CROSS_PROMO = {
  gameName: 'Sudoku Race',
  tagline: 'Share a Sudoku with friends and race to solve it fastest.',
  appUrl: `https://sudoku.${DOMAIN}`,
  appStoreUrl: 'https://apps.apple.com/app/sudoku-race/id6517357180',
  googlePlayUrl: `https://play.google.com/store/apps/details?id=${REVERSE_DOMAIN}.sudoku`,
};

module.exports = { APP_CONFIG, CROSS_PROMO };
