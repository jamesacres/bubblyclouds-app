const APP = 'sudoku';
const APP_NAME = 'Sudoku Race';
const DOMAIN = 'bubblyclouds.com';
const REVERSE_DOMAIN = 'com.bubblyclouds';
const COMPANY_NAME = 'Bubbly Clouds';
const APP_CONFIG = {
  app: APP,
  appName: APP_NAME,
  appId: `${REVERSE_DOMAIN}.${APP}`,
  appUrl: `https://${APP}.${DOMAIN}`,
  apiUrl: `https://api.${DOMAIN}`,
  authUrl: `https://auth.${DOMAIN}`,
  companyUrl: `https://${DOMAIN}`,
  companyName: COMPANY_NAME,
  privacyUrl: `https://${DOMAIN}/privacy`,
  termsUrl: `https://${DOMAIN}/terms`,
  creditsUrl: '/credits',
  appStoreUrl: 'https://apps.apple.com/app/sudoku-race/id6517357180',
  googlePlayUrl:
    'https://play.google.com/store/apps/details?id=com.bubblyclouds.sudoku',
  deepLinkScheme: `${REVERSE_DOMAIN}.${APP}`,
  mobileDescription: `Get the best racing experience with our ${APP_NAME} app!`,
  desktopDescription: `Download ${APP_NAME}`,
  openInAppLabel: 'Open Puzzle',
};

module.exports = { APP_CONFIG };
