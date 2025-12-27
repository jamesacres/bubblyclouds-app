import {
  app,
  BrowserWindow,
  ipcMain,
  safeStorage,
  screen,
  shell,
} from 'electron';
import serve from 'electron-serve';
import Store from 'electron-store';
import path from 'path';
const __dirname = import.meta.dirname;

const { APP_CONFIG } = require('../app.config.js');

const scheme = APP_CONFIG.deepLinkScheme;

const store = new Store({
  state: {
    type: 'string',
  },
});

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(scheme, process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient(scheme);
}

const appServe = serve({
  directory: path.join(__dirname, 'out'),
});

let win;
const createWindow = () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  win = new BrowserWindow({
    show: false,
    width: width - 100,
    height: height - 100,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  appServe(win).then(() => {
    if (store.has('state')) {
      win.loadURL(`app://-/restoreState.html?state=${store.get('state')}`);
    } else {
      win.loadURL('app://-');
    }
  });

  win.once('ready-to-show', () => {
    win.show();
  });
};

const handleDeepLink = (url) => {
  if (win) {
    if (win.isMinimized()) {
      win.restore();
    }
    win.focus();
    win.loadURL(url.replace(scheme, 'app'));
  }
};

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, commandLine, _workingDirectory) => {
    const url = commandLine.pop();
    handleDeepLink(url);
  });
  app.on('open-url', (_event, url) => {
    handleDeepLink(url);
  });

  // Create mainWindow, load the rest of the app, etc...
  app.whenReady().then(() => {
    createWindow();
  });
}

app.on('window-all-closed', () => {
  //if (process.platform !== 'darwin') {
  app.quit();
  //}
});

ipcMain.handle('openBrowser', (_event, url) => {
  shell.openExternal(url);
});

ipcMain.handle('saveState', (_event, encryptedString) => {
  store.set('state', encryptedString);
});

ipcMain.handle('encrypt', (_event, plainText) => {
  return safeStorage
    .encryptString(plainText)
    .toString('base64')
    .replace(/[+/=]/g, function (m0) {
      return m0 === '+' ? '-' : m0 === '/' ? '_' : '*';
    });
});

ipcMain.handle('decrypt', (_event, encryptedString) => {
  return safeStorage.decryptString(
    Buffer.from(
      encryptedString.replace(/[-_*]/g, function (m0) {
        return m0 === '-' ? '+' : m0 === '_' ? '/' : '=';
      }),
      'base64'
    )
  );
});
