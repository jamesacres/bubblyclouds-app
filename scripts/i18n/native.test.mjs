import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import {
  APP_NAMES,
  NATIVE_CODES,
  androidEscape,
  androidStringsXml,
  generate,
  infoPlistStrings,
  localesConfigXml,
  patchGradle,
  patchInfoPlist,
  patchManifest,
  patchPbxproj,
  run,
  usageKeys,
} from './native.mjs';
import { defaultRepoRoot } from './roots.mjs';

const root = defaultRepoRoot();

function localeTags() {
  const source = fs.readFileSync(
    path.join(root, 'packages/ui/src/config/locales.ts'),
    'utf8'
  );
  const block = source.match(/LOCALE_TAGS = \[([\s\S]*?)\] as const/)[1];
  return [...block.matchAll(/'([^']+)'/g)].map((match) => match[1]);
}

test('every LOCALE_TAGS entry has a native mapping and no extras', () => {
  assert.deepEqual(Object.keys(NATIVE_CODES).sort(), localeTags().sort());
});

test('mapping table matches the agreed platform codes', () => {
  const expected = {
    pt: ['pt-BR', 'pt', 'pt-BR'],
    'pt-PT': ['pt-PT', 'pt-rPT', 'pt-PT'],
    'zh-Hans': ['zh-Hans', 'b+zh+Hans', 'zh-Hans'],
    'zh-Hant': ['zh-Hant', 'b+zh+Hant', 'zh-Hant'],
    'es-MX': ['es-MX', 'es-rMX', 'es-MX'],
    'fr-CA': ['fr-CA', 'fr-rCA', 'fr-CA'],
    nb: ['nb', 'nb', 'nb'],
    he: ['he', 'iw', 'he'],
    id: ['id', 'in', 'id'],
    de: ['de', 'de', 'de'],
  };
  for (const [tag, [ios, android, bcp47]] of Object.entries(expected)) {
    assert.deepEqual(NATIVE_CODES[tag], { ios, android, bcp47 });
  }
});

test('Android codes are valid resource qualifiers and unique', () => {
  const codes = Object.values(NATIVE_CODES).map((entry) => entry.android);
  assert.equal(new Set(codes).size, codes.length);
  for (const code of codes) {
    assert.match(
      code,
      /^([a-z]{2,3}(-r[A-Z]{2})?|b\+[a-z]{2}\+[A-Z][a-z]{3})$/
    );
  }
});

test('InfoPlist.strings output is quoted and escaped', () => {
  assert.equal(
    infoPlistStrings([
      ['CFBundleDisplayName', 'Say "hi"'],
      ['NSCameraUsageDescription', 'C:\\x'],
    ]),
    '"CFBundleDisplayName" = "Say \\"hi\\"";\n"NSCameraUsageDescription" = "C:\\\\x";\n'
  );
});

test('Android strings escape apostrophes, ampersands and leading @', () => {
  assert.equal(androidEscape("It's & <b>"), "It\\'s &amp; &lt;b&gt;");
  assert.equal(androidEscape('@x'), '\\@x');
  const xml = androidStringsXml('Race');
  assert.match(xml, /<string name="app_name">Race<\/string>/);
  assert.match(xml, /<string name="title_activity_main">Race<\/string>/);
  assert.doesNotMatch(xml, /package_name|custom_url_scheme/);
});

test('locales_config lists every locale as BCP-47', () => {
  const xml = localesConfigXml(['en', 'pt-BR', 'zh-Hans']);
  assert.match(xml, /<locale-config xmlns:android=/);
  assert.equal((xml.match(/<locale android:name=/g) ?? []).length, 3);
  assert.match(xml, /android:name="pt-BR"/);
});

test('Info.plist patch inserts and replaces CFBundleLocalizations', () => {
  const plist =
    '<dict>\n\t<key>CFBundleName</key>\n\t<string>x</string>\n</dict>\n';
  const once = patchInfoPlist(plist, ['en', 'de']);
  assert.match(once, /<key>CFBundleLocalizations<\/key>/);
  assert.equal(patchInfoPlist(once, ['en', 'de']), once);
  const twice = patchInfoPlist(once, ['en', 'de', 'fr']);
  assert.equal((twice.match(/CFBundleLocalizations/g) ?? []).length, 1);
  assert.match(twice, /<string>fr<\/string>/);
});

test('usageKeys finds NS*UsageDescription entries only', () => {
  const plist =
    '<key>NSCameraUsageDescription</key>\n\t<string>Cam</string>\n<key>CFBundleName</key><string>x</string>';
  assert.deepEqual(usageKeys(plist), [
    { key: 'NSCameraUsageDescription', text: 'Cam' },
  ]);
});

test('manifest and gradle patches are idempotent', () => {
  const manifest =
    '<application\n        android:icon="@mipmap/ic_launcher"\n        android:label="@string/app_name"\n        android:theme="@style/AppTheme">';
  const patched = patchManifest(manifest);
  assert.match(patched, /android:localeConfig="@xml\/locales_config"/);
  assert.equal(patchManifest(patched), patched);
  const gradle = 'android {\n    buildTypes {\n    }\n}\n';
  const gradled = patchGradle(gradle);
  assert.match(gradled, /enableSplit = false/);
  assert.equal(patchGradle(gradled), gradled);
});

test('pbxproj patch registers the variant group once', () => {
  const real = fs.readFileSync(
    path.join(root, 'apps/sudoku/ios/App/App.xcodeproj/project.pbxproj'),
    'utf8'
  );
  const patched = patchPbxproj(real, ['de', 'pt-BR']);
  assert.equal(patchPbxproj(patched, ['de', 'pt-BR']), patched);
  assert.equal(
    (patched.match(/\/\* InfoPlist\.strings \*\/ = \{\n/g) ?? []).length,
    1
  );
  assert.match(
    patched,
    /knownRegions = \(\n\t\t\t\ten,\n\t\t\t\tBase,\n\t\t\t\tde,\n\t\t\t\t"pt-BR",/
  );
  assert.match(patched, /path = "pt-BR\.lproj\/InfoPlist\.strings"/);
  const reduced = patchPbxproj(patched, ['de']);
  assert.doesNotMatch(reduced, /pt-BR/);
});

test('generated output covers every tag for every app', () => {
  const outputs = generate(root);
  for (const app of APP_NAMES) {
    for (const entry of Object.values(NATIVE_CODES)) {
      assert.ok(
        outputs.has(
          `apps/${app}/ios/App/App/${entry.ios}.lproj/InfoPlist.strings`
        )
      );
      assert.ok(
        outputs.has(
          `apps/${app}/android/app/src/main/res/values-${entry.android}/strings.xml`
        )
      );
    }
  }
});

test('camera usage description is translated in every locale for sudoku', () => {
  const outputs = generate(root);
  for (const entry of Object.values(NATIVE_CODES)) {
    const strings = outputs.get(
      `apps/sudoku/ios/App/App/${entry.ios}.lproj/InfoPlist.strings`
    );
    assert.match(strings, /^"CFBundleDisplayName" = ".+";$/m);
    assert.match(strings, /^"NSCameraUsageDescription" = ".+";$/m);
  }
});

test('committed native files match the generator', () => {
  assert.deepEqual(run('check', root), []);
});
