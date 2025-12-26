module.exports = {
  electronVersion: require('electron/package.json').version,
  appId: 'io.github.jamesacres.sudoku-web',
  productName: 'Sudoku Race',
  copyright: 'Copyright (c) 2024 James Acres',
  win: {
    target: ['dir', 'portable', 'zip'],
    icon: 'resources/icon.ico',
  },
  linux: {
    target: ['dir', 'appimage', 'zip'],
    icon: 'resources/icon.png',
  },
  mac: {
    target: ['dir', 'dmg', 'zip'],
    icon: 'resources/icon.icns',
    extendInfo: 'com.bubblyclouds.sudoku',
  },
  protocols: {
    name: 'com.bubblyclouds.sudoku',
    schemes: ['com.bubblyclouds.sudoku'],
  },
};
