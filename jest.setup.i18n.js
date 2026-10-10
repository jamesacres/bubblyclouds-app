const path = require('path');

const uiPackage = path.join(__dirname, 'packages', 'ui');
const i18next = require(require.resolve('i18next', { paths: [uiPackage] }));
const { initReactI18next } = require(
  require.resolve('react-i18next', { paths: [uiPackage] })
);

const namespaces = [
  'ui',
  'auth',
  'template',
  'games',
  'sudoku',
  'unblockrace',
];

const bundles = {};
for (const namespace of namespaces) {
  bundles[namespace] = require(
    path.join(__dirname, 'packages', namespace, 'src', 'locales', 'en.json')
  );
}

if (!i18next.isInitialized) {
  i18next.use(initReactI18next).init({
    resources: { en: bundles },
    lng: 'en',
    fallbackLng: 'en',
    supportedLngs: ['en'],
    ns: namespaces,
    defaultNS: 'app',
    initAsync: false,
    returnNull: false,
    interpolation: { escapeValue: false },
  });
}

module.exports = {
  addAppBundle(appBundle) {
    i18next.addResourceBundle('en', 'app', appBundle, true, true);
  },
};
