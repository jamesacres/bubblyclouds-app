import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultRepoRoot } from './roots.mjs';

export const APP_NAMES = ['sudoku', 'unblockrace'];

export const NATIVE_CODES = {
  ar: { ios: 'ar', android: 'ar', bcp47: 'ar' },
  bn: { ios: 'bn', android: 'bn', bcp47: 'bn' },
  ca: { ios: 'ca', android: 'ca', bcp47: 'ca' },
  cs: { ios: 'cs', android: 'cs', bcp47: 'cs' },
  da: { ios: 'da', android: 'da', bcp47: 'da' },
  de: { ios: 'de', android: 'de', bcp47: 'de' },
  el: { ios: 'el', android: 'el', bcp47: 'el' },
  es: { ios: 'es', android: 'es', bcp47: 'es' },
  'es-MX': { ios: 'es-MX', android: 'es-rMX', bcp47: 'es-MX' },
  fi: { ios: 'fi', android: 'fi', bcp47: 'fi' },
  fr: { ios: 'fr', android: 'fr', bcp47: 'fr' },
  'fr-CA': { ios: 'fr-CA', android: 'fr-rCA', bcp47: 'fr-CA' },
  gu: { ios: 'gu', android: 'gu', bcp47: 'gu' },
  he: { ios: 'he', android: 'iw', bcp47: 'he' },
  hi: { ios: 'hi', android: 'hi', bcp47: 'hi' },
  hr: { ios: 'hr', android: 'hr', bcp47: 'hr' },
  hu: { ios: 'hu', android: 'hu', bcp47: 'hu' },
  id: { ios: 'id', android: 'in', bcp47: 'id' },
  it: { ios: 'it', android: 'it', bcp47: 'it' },
  ja: { ios: 'ja', android: 'ja', bcp47: 'ja' },
  kn: { ios: 'kn', android: 'kn', bcp47: 'kn' },
  ko: { ios: 'ko', android: 'ko', bcp47: 'ko' },
  ml: { ios: 'ml', android: 'ml', bcp47: 'ml' },
  mr: { ios: 'mr', android: 'mr', bcp47: 'mr' },
  ms: { ios: 'ms', android: 'ms', bcp47: 'ms' },
  nb: { ios: 'nb', android: 'nb', bcp47: 'nb' },
  nl: { ios: 'nl', android: 'nl', bcp47: 'nl' },
  or: { ios: 'or', android: 'or', bcp47: 'or' },
  pa: { ios: 'pa', android: 'pa', bcp47: 'pa' },
  pl: { ios: 'pl', android: 'pl', bcp47: 'pl' },
  pt: { ios: 'pt-BR', android: 'pt', bcp47: 'pt-BR' },
  'pt-PT': { ios: 'pt-PT', android: 'pt-rPT', bcp47: 'pt-PT' },
  ro: { ios: 'ro', android: 'ro', bcp47: 'ro' },
  ru: { ios: 'ru', android: 'ru', bcp47: 'ru' },
  sk: { ios: 'sk', android: 'sk', bcp47: 'sk' },
  sl: { ios: 'sl', android: 'sl', bcp47: 'sl' },
  sv: { ios: 'sv', android: 'sv', bcp47: 'sv' },
  ta: { ios: 'ta', android: 'ta', bcp47: 'ta' },
  te: { ios: 'te', android: 'te', bcp47: 'te' },
  th: { ios: 'th', android: 'th', bcp47: 'th' },
  tr: { ios: 'tr', android: 'tr', bcp47: 'tr' },
  uk: { ios: 'uk', android: 'uk', bcp47: 'uk' },
  ur: { ios: 'ur', android: 'ur', bcp47: 'ur' },
  vi: { ios: 'vi', android: 'vi', bcp47: 'vi' },
  'zh-Hans': { ios: 'zh-Hans', android: 'b+zh+Hans', bcp47: 'zh-Hans' },
  'zh-Hant': { ios: 'zh-Hant', android: 'b+zh+Hant', bcp47: 'zh-Hant' },
};

const USAGE_KEY = /^NS\w+UsageDescription$/;
const PLIST_LOCALIZATIONS =
  /\t<key>CFBundleLocalizations<\/key>\n\t<array>\n[\s\S]*?\t<\/array>\n/;
const ID_PREFIX = 'InfoPlist.strings';

export function tags() {
  return Object.keys(NATIVE_CODES);
}

export function xmlEscape(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function androidEscape(value) {
  const text = xmlEscape(value)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"');
  return /^[@?]/.test(text) ? `\\${text}` : text;
}

export function plistStringsEscape(value) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function infoPlistStrings(entries) {
  return (
    entries
      .map(([key, value]) => `"${key}" = "${plistStringsEscape(value)}";`)
      .join('\n') + '\n'
  );
}

export function androidStringsXml(appName) {
  const name = androidEscape(appName);
  return `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${name}</string>
    <string name="title_activity_main">${name}</string>
</resources>
`;
}

export function localesConfigXml(codes) {
  const lines = codes.map((code) => `    <locale android:name="${code}" />`);
  return `<?xml version="1.0" encoding="utf-8"?>
<locale-config xmlns:android="http://schemas.android.com/apk/res/android">
${lines.join('\n')}
</locale-config>
`;
}

export function bundleLocalizationsBlock(codes) {
  const items = codes.map((code) => `\t\t<string>${code}</string>\n`).join('');
  return `\t<key>CFBundleLocalizations</key>\n\t<array>\n${items}\t</array>\n`;
}

export function patchInfoPlist(text, codes) {
  const block = bundleLocalizationsBlock(codes);
  if (PLIST_LOCALIZATIONS.test(text)) {
    return text.replace(PLIST_LOCALIZATIONS, block);
  }
  const anchor = '\t<key>CFBundleName</key>';
  if (!text.includes(anchor)) {
    throw new Error('Info.plist has no CFBundleName anchor');
  }
  return text.replace(anchor, `${block}${anchor}`);
}

export function usageKeys(plistText) {
  return [
    ...plistText.matchAll(
      /<key>(NS\w+UsageDescription)<\/key>\s*<string>([\s\S]*?)<\/string>/g
    ),
  ]
    .filter((match) => USAGE_KEY.test(match[1]))
    .map((match) => ({ key: match[1], text: match[2] }));
}

export function patchManifest(text) {
  if (text.includes('android:localeConfig=')) {
    return text.replace(
      /android:localeConfig="[^"]*"/,
      'android:localeConfig="@xml/locales_config"'
    );
  }
  const anchor = /^(\s*)android:label="@string\/app_name"\n/m;
  if (!anchor.test(text)) {
    throw new Error('AndroidManifest has no application label anchor');
  }
  return text.replace(
    anchor,
    (line, indent) =>
      `${line}${indent}android:localeConfig="@xml/locales_config"\n`
  );
}

export function patchGradle(text) {
  if (text.includes('enableSplit')) {
    return text;
  }
  const anchor = '    buildTypes {\n';
  if (!text.includes(anchor)) {
    throw new Error('build.gradle has no buildTypes anchor');
  }
  const block =
    '    bundle {\n        language {\n            enableSplit = false\n        }\n    }\n';
  return text.replace(anchor, `${block}${anchor}`);
}

function pbxValue(value) {
  return /^[A-Za-z0-9_./]+$/.test(value) ? value : `"${value}"`;
}

function pbxId(name) {
  return createHash('sha1')
    .update(`${ID_PREFIX}:${name}`)
    .digest('hex')
    .slice(0, 24)
    .toUpperCase();
}

export function patchPbxproj(text, iosCodes) {
  const groupId = pbxId('group');
  const buildId = pbxId('build');
  const groupBlock = new RegExp(
    `\\t\\t(\\w{24}) /\\* InfoPlist\\.strings \\*/ = \\{\\n\\t\\t\\tisa = PBXVariantGroup;\\n\\t\\t\\tchildren = \\(\\n([\\s\\S]*?)\\t\\t\\t\\);\\n[\\s\\S]*?\\t\\t\\};\\n`
  );
  let out = text;
  const existing = out.match(groupBlock);
  const stale = new Set([groupId, buildId]);
  if (existing) {
    stale.add(existing[1]);
    for (const child of existing[2].matchAll(/(\w{24}) \/\*/g)) {
      stale.add(child[1]);
    }
    out = out.replace(groupBlock, '');
  }
  out = out
    .split('\n')
    .filter((line) => ![...stale].some((id) => line.includes(id)))
    .join('\n');

  const sorted = [...iosCodes].sort();
  const refs = sorted.map((code) => ({ code, id: pbxId(`ref:${code}`) }));

  const insertBefore = (source, marker, content) => {
    if (!source.includes(marker)) {
      throw new Error(`project.pbxproj has no ${marker.trim()}`);
    }
    return source.replace(marker, `${content}${marker}`);
  };

  out = insertBefore(
    out,
    '/* End PBXBuildFile section */',
    `\t\t${buildId} /* InfoPlist.strings in Resources */ = {isa = PBXBuildFile; fileRef = ${groupId} /* InfoPlist.strings */; };\n`
  );
  out = insertBefore(
    out,
    '/* End PBXFileReference section */',
    refs
      .map(
        ({ code, id }) =>
          `\t\t${id} /* ${code} */ = {isa = PBXFileReference; lastKnownFileType = text.plist.strings; name = ${pbxValue(code)}; path = ${pbxValue(`${code}.lproj/InfoPlist.strings`)}; sourceTree = "<group>"; };\n`
      )
      .join('')
  );
  out = insertBefore(
    out,
    '/* End PBXVariantGroup section */',
    `\t\t${groupId} /* InfoPlist.strings */ = {\n\t\t\tisa = PBXVariantGroup;\n\t\t\tchildren = (\n${refs
      .map(({ code, id }) => `\t\t\t\t${id} /* ${code} */,\n`)
      .join(
        ''
      )}\t\t\t);\n\t\t\tname = InfoPlist.strings;\n\t\t\tsourceTree = "<group>";\n\t\t};\n`
  );

  const plistChild = /^(\t+)(\w{24}) \/\* Info\.plist \*\/,\n/m;
  if (!plistChild.test(out)) {
    throw new Error('project.pbxproj has no Info.plist group child');
  }
  out = out.replace(
    plistChild,
    (line, indent) => `${line}${indent}${groupId} /* InfoPlist.strings */,\n`
  );

  const resources =
    /(\/\* Begin PBXResourcesBuildPhase section \*\/[\s\S]*?files = \(\n)/;
  if (!resources.test(out)) {
    throw new Error('project.pbxproj has no Resources build phase');
  }
  out = out.replace(
    resources,
    `$1\t\t\t\t${buildId} /* InfoPlist.strings in Resources */,\n`
  );

  const regions = /knownRegions = \(\n[\s\S]*?\t\t\t\);\n/;
  if (!regions.test(out)) {
    throw new Error('project.pbxproj has no knownRegions');
  }
  out = out.replace(
    regions,
    `knownRegions = (\n\t\t\t\ten,\n\t\t\t\tBase,\n${sorted
      .map((code) => `\t\t\t\t${pbxValue(code)},\n`)
      .join('')}\t\t\t);\n`
  );
  return out;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function read(root, rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

export function generate(root = defaultRepoRoot()) {
  const outputs = new Map();
  const allTags = tags();
  const nativeStrings = readJson(
    path.join(root, 'scripts/i18n/native-strings.json')
  );
  const iosCodes = allTags.map((tag) => NATIVE_CODES[tag].ios);

  for (const app of APP_NAMES) {
    const names = {};
    for (const tag of allTags) {
      const glossary = readJson(
        path.join(root, 'scripts/i18n/glossary', `${tag}.json`)
      );
      const appName = glossary[app]?.brand?.appName;
      if (!appName) {
        throw new Error(`glossary ${tag} has no ${app}.brand.appName`);
      }
      names[tag] = appName;
    }

    const iosDir = `apps/${app}/ios/App/App`;
    const infoPlist = read(root, `${iosDir}/Info.plist`);
    const keys = usageKeys(infoPlist);
    for (const { key, text } of keys) {
      const table = nativeStrings[key];
      if (!table) {
        throw new Error(`native-strings.json has no ${key}`);
      }
      if (table.en !== text) {
        throw new Error(
          `native-strings.json ${key}.en differs from ${app} Info.plist`
        );
      }
      for (const tag of allTags) {
        if (!table[tag]) {
          throw new Error(`native-strings.json ${key} is missing ${tag}`);
        }
      }
    }

    outputs.set(
      `${iosDir}/Info.plist`,
      patchInfoPlist(infoPlist, ['en', ...iosCodes])
    );
    for (const tag of allTags) {
      const entries = [
        ['CFBundleDisplayName', names[tag]],
        ...keys.map(({ key }) => [key, nativeStrings[key][tag]]),
      ];
      outputs.set(
        `${iosDir}/${NATIVE_CODES[tag].ios}.lproj/InfoPlist.strings`,
        infoPlistStrings(entries)
      );
    }
    const pbxproj = `apps/${app}/ios/App/App.xcodeproj/project.pbxproj`;
    outputs.set(pbxproj, patchPbxproj(read(root, pbxproj), iosCodes));

    const androidMain = `apps/${app}/android/app/src/main`;
    for (const tag of allTags) {
      outputs.set(
        `${androidMain}/res/values-${NATIVE_CODES[tag].android}/strings.xml`,
        androidStringsXml(names[tag])
      );
    }
    outputs.set(
      `${androidMain}/res/xml/locales_config.xml`,
      localesConfigXml(['en', ...allTags.map((tag) => NATIVE_CODES[tag].bcp47)])
    );
    const manifest = `${androidMain}/AndroidManifest.xml`;
    outputs.set(manifest, patchManifest(read(root, manifest)));
    const gradle = `apps/${app}/android/app/build.gradle`;
    outputs.set(gradle, patchGradle(read(root, gradle)));
  }
  return outputs;
}

export function run(mode, root = defaultRepoRoot()) {
  const outputs = generate(root);
  const changed = [];
  for (const [rel, content] of outputs) {
    const file = path.join(root, rel);
    const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
    if (current === content) {
      continue;
    }
    changed.push(rel);
    if (mode === 'write') {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, content);
    }
  }
  return changed;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const mode = process.argv.includes('--write') ? 'write' : 'check';
  if (!process.argv.includes('--write') && !process.argv.includes('--check')) {
    console.error('Usage: node scripts/i18n/native.mjs --write | --check');
    process.exit(2);
  }
  const changed = run(mode);
  if (mode === 'write') {
    console.log(`native: wrote ${changed.length} file(s)`);
  } else if (changed.length > 0) {
    console.error(
      `native: ${changed.length} file(s) out of date, run node scripts/i18n/native.mjs --write\n${changed.map((rel) => `  ${rel}`).join('\n')}`
    );
    process.exit(1);
  } else {
    console.log('native: up to date');
  }
}
