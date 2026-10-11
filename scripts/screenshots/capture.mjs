import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const { values } = parseArgs({
  options: {
    app: { type: 'string' },
    locale: { type: 'string' },
    only: { type: 'string' },
    from: { type: 'string' },
    udid: { type: 'string' },
    port: { type: 'string', default: '8787' },
    settle: { type: 'string', default: '2000' },
    data: { type: 'string', default: join(here, '.data') },
    'keep-status-bar': { type: 'boolean', default: false },
    overwrite: { type: 'boolean', default: false },
    'no-build': { type: 'boolean', default: false },
  },
});

if (!values.app) {
  console.error(
    'usage: node scripts/screenshots/capture.mjs --app <app> [--locale de,fr] [--only 03,05] [--from 03] [--udid <udid>] [--port 8787] [--settle 2000] [--overwrite] [--keep-status-bar] [--no-build]'
  );
  process.exit(1);
}

const appDir = join(here, values.app);
const config = JSON.parse(readFileSync(join(appDir, 'config.json'), 'utf8'));
const english = JSON.parse(
  readFileSync(join(appDir, 'captions', 'en.json'), 'utf8')
);
const allLocales = Object.keys(
  JSON.parse(readFileSync(join(here, 'locales.json'), 'utf8'))
);
const locales = values.locale ? values.locale.split(',') : allLocales;
const unknown = locales.filter((tag) => !allLocales.includes(tag));
if (unknown.length > 0) {
  console.error(`unknown locales: ${unknown.join(', ')}`);
  process.exit(1);
}
const only = values.only ? values.only.split(',') : null;
const from = values.from ? Number(values.from) : null;
const settleMs = Number(values.settle);
const port = Number(values.port);
const serverUrl = `http://localhost:${port}`;

const buildHint = () => `
  run this command without --no-build, or build and install it yourself with
  NEXT_PUBLIC_SCREENSHOT_SERVER=${serverUrl} set.`;

const simctl = (...args) =>
  execFileSync('xcrun', ['simctl', ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

const findBooted = () => {
  const { devices } = JSON.parse(simctl('list', 'devices', 'booted', '-j'));
  const booted = Object.values(devices)
    .flat()
    .filter((device) => device.state === 'Booted');
  if (booted.length === 0) {
    console.error(`No booted simulator found.

  1. Boot a 6.3" iPhone simulator (iPhone 16 Pro or 17 Pro, 1206x2622):
       xcrun simctl boot "iPhone 17 Pro"
     and show its window from Xcode (Device Hub).
  2. Run this command again.`);
    process.exit(1);
  }
  if (booted.length > 1) {
    console.error(
      `More than one booted simulator:\n${booted
        .map((device) => `  ${device.name}  ${device.udid}`)
        .join('\n')}\nPass one with --udid <udid>.`
    );
    process.exit(1);
  }
  return booted[0];
};

const target = values.udid
  ? { udid: values.udid, name: values.udid }
  : findBooted();
const udid = target.udid;
console.log(`Using simulator: ${target.name} (${udid})`);

const appPath = join(root, 'apps', values.app);
const screenshotBuildOutputs = [
  join(appPath, 'out'),
  join(appPath, 'dist'),
  join(appPath, 'ios', 'App', 'App', 'public'),
];
let server;
let screenshotBuild = false;
let finishing = false;

const removeScreenshotBuild = () => {
  for (const dir of screenshotBuildOutputs) {
    rmSync(dir, { recursive: true, force: true });
  }
  console.log(
    `\nRemoved the screenshot build output so it cannot be published. Run pnpm build:${values.app}:capacitor before the next release.`
  );
};

const finish = (code) => {
  if (finishing) {
    return;
  }
  finishing = true;
  server?.close();
  if (screenshotBuild) {
    removeScreenshotBuild();
  }
  process.exit(code);
};

process.on('SIGINT', () => finish(130));
process.on('SIGTERM', () => finish(143));

if (!values['no-build']) {
  const env = {
    ...process.env,
    IS_CAPACITOR: 'true',
    NEXT_PUBLIC_SCREENSHOT_SERVER: serverUrl,
  };
  console.log(
    `\nBuilding ${values.app} with the screenshot server (${serverUrl})...`
  );
  rmSync(join(appPath, 'out'), { recursive: true, force: true });
  rmSync(join(appPath, 'dist'), { recursive: true, force: true });
  screenshotBuild = true;
  try {
    execFileSync('pnpm', ['run', `build:${values.app}`, '--force'], {
      cwd: root,
      env,
      stdio: 'inherit',
    });
    console.log('\nSyncing the native project...');
    execFileSync('npx', ['cap', 'sync', 'ios'], {
      cwd: appPath,
      env,
      stdio: 'inherit',
    });
    console.log(`\nBuilding the native app for ${target.name}...`);
    const derivedData = join(here, '.build', 'derived', values.app);
    execFileSync(
      'xcodebuild',
      [
        '-quiet',
        '-workspace',
        join(appPath, 'ios', 'App', 'App.xcworkspace'),
        '-scheme',
        'App',
        '-configuration',
        'Debug',
        '-destination',
        `id=${udid}`,
        '-derivedDataPath',
        derivedData,
        'build',
      ],
      { env, stdio: 'inherit' }
    );
    console.log(`\nInstalling on ${target.name}...`);
    simctl(
      'install',
      udid,
      join(derivedData, 'Build', 'Products', 'Debug-iphonesimulator', 'App.app')
    );
  } catch {
    console.error('\nBuild or install failed; see the output above.');
    finish(1);
  }
}

let currentLocale = 'en';
let lastPoll = 0;
server = createServer((request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Cache-Control', 'no-store');
  if (request.url === '/locale') {
    lastPoll = Date.now();
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify({ locale: currentLocale }));
    return;
  }
  response.statusCode = 404;
  response.end();
});
await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(port, resolve);
}).catch((error) => {
  console.error(`could not listen on ${port}: ${error.message}`);
  finish(1);
});

const setLocale = async (tag) => {
  currentLocale = tag;
  await sleep(settleMs);
};

if (!values['keep-status-bar']) {
  simctl(
    'status_bar',
    udid,
    'override',
    '--time',
    '9:41',
    '--batteryState',
    'charged',
    '--batteryLevel',
    '100',
    '--cellularMode',
    'active',
    '--cellularBars',
    '4',
    '--wifiBars',
    '3'
  );
}

try {
  simctl('terminate', udid, config.bundleId);
} catch {
  // not running
}
try {
  simctl('launch', udid, config.bundleId);
} catch {
  console.error(
    `${config.bundleId} is not installed on this simulator. Build and install it, then run this again:${buildHint()}`
  );
  finish(1);
}

process.stdout.write('Waiting for the app to connect...');
const deadline = Date.now() + 20000;
while (Date.now() < deadline && lastPoll === 0) {
  await sleep(250);
}
if (lastPoll === 0) {
  console.error(`
The app did not connect to ${serverUrl}.
The installed build was not built with the screenshot server, so it cannot
switch language. Rebuild and reinstall it:${buildHint()}`);
  finish(1);
}
console.log(' connected.');

console.log(
  `\nThe app is open on the simulator. For each screen below:
  - navigate to it in the simulator, then come back here and press Enter
  - the script then switches language through all ${locales.length} locales for you; leave the simulator alone until it finishes`
);

const readline = createInterface({
  input: process.stdin,
  output: process.stdout,
});
readline.on('SIGINT', () => finish(130));

for (const screen of config.screens) {
  if (only && !only.includes(screen.id)) continue;
  if (from !== null && Number(screen.id) < from) continue;
  const pending = locales.filter(
    (tag) =>
      values.overwrite ||
      !existsSync(join(values.data, values.app, 'shots', tag, screen.capture))
  );
  if (pending.length === 0) {
    console.log(
      `${screen.id}: all ${locales.length} locales captured, skipping`
    );
    continue;
  }

  const hint = english[screen.id];
  await setLocale('en');
  await readline.question(
    `\n[${screen.id}/${config.screens.length}] ${hint.title}\n  ${hint.subtitle.replace('\n', ' ')}\nNavigate to this screen, then press Enter to capture ${pending.length} locales... `
  );

  for (const tag of pending) {
    await setLocale(tag);
    const dir = join(values.data, values.app, 'shots', tag);
    mkdirSync(dir, { recursive: true });
    simctl('io', udid, 'screenshot', '--type=png', join(dir, screen.capture));
    console.log(`  ${screen.id} ${tag}`);
  }
  await setLocale('en');
}

await setLocale('');
readline.close();
console.log(
  `\ncaptures done. compose with: node scripts/screenshots/compose.mjs --app ${values.app}`
);
finish(0);
