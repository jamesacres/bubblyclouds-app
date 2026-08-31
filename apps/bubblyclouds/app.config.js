const APP = 'bubblyclouds';
const APP_NAME = 'Bubbly Clouds';
const DOMAIN = 'bubblyclouds.com';
const REVERSE_DOMAIN = 'com.bubblyclouds';
const COMPANY_NAME = 'Bubbly Clouds';
const APP_CONFIG = {
  app: APP,
  scope: ['openid', 'profile'],
  appName: APP_NAME,
  gameName: APP_NAME,
  appId: `${REVERSE_DOMAIN}`,
  appUrl: `https://${DOMAIN}`,
  apiUrl: `https://api.${DOMAIN}`,
  authUrl: `https://auth.${DOMAIN}`,
  companyUrl: `https://${DOMAIN}`,
  companyName: COMPANY_NAME,
  privacyUrl: `/privacy`,
  termsUrl: `/terms`,
};

module.exports = { APP_CONFIG };
