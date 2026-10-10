const fs = require('fs');
const path = require('path');

const uiPackage = path.join(__dirname, 'packages', 'ui');
const i18next = require(require.resolve('i18next', { paths: [uiPackage] }));
const { initReactI18next } = require(
  require.resolve('react-i18next', { paths: [uiPackage] })
);

const namespaces = ['ui', 'auth', 'template', 'games', 'sudoku', 'unblockrace'];

const SOURCE_LOCALE = 'en';

function localeTags(localesDir) {
  if (!fs.existsSync(localesDir)) {
    return [];
  }
  return fs
    .readdirSync(localesDir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.slice(0, -'.json'.length));
}

const resources = { [SOURCE_LOCALE]: {} };
const supportedLngs = new Set([SOURCE_LOCALE]);

function load(namespace, localesDir) {
  for (const tag of localeTags(localesDir)) {
    resources[tag] ??= {};
    resources[tag][namespace] = require(path.join(localesDir, `${tag}.json`));
    supportedLngs.add(tag);
  }
}

for (const namespace of namespaces) {
  load(
    namespace,
    path.join(__dirname, 'packages', namespace, 'src', 'locales')
  );
}

if (!i18next.isInitialized) {
  i18next.use(initReactI18next).init({
    resources,
    lng: SOURCE_LOCALE,
    fallbackLng: SOURCE_LOCALE,
    supportedLngs: [...supportedLngs],
    ns: namespaces,
    defaultNS: 'app',
    initAsync: false,
    returnNull: false,
    interpolation: { escapeValue: false },
  });
}

module.exports = {
  addAppBundle(appBundle, appDir) {
    i18next.addResourceBundle(SOURCE_LOCALE, 'app', appBundle, true, true);
    if (!appDir) {
      return;
    }
    const localesDir = path.join(appDir, 'src', 'locales');
    for (const tag of localeTags(localesDir)) {
      if (tag === SOURCE_LOCALE) {
        continue;
      }
      i18next.addResourceBundle(
        tag,
        'app',
        require(path.join(localesDir, `${tag}.json`)),
        true,
        true
      );
    }
  },
};
