interface ElectronAPI {
  openBrowser: (url: string) => Promise<unknown>;
  encrypt: (data: string) => Promise<string>;
  decrypt: (data: string) => Promise<string>;
  saveState: (state: string) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

const isElectron = (): boolean =>
  typeof window !== 'undefined' && 'electronAPI' in window;

const openBrowser = async (url: string) => {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }
  return await window.electronAPI.openBrowser(url);
};

const saveElectronState = async (state: unknown) => {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }
  const encryptedState = await window.electronAPI.encrypt(
    JSON.stringify(state)
  );
  await window.electronAPI.saveState(encryptedState);
};

export { isElectron, openBrowser, saveElectronState };
