const isElectron = (): boolean =>
  typeof window !== 'undefined' && 'electronAPI' in window;

const openBrowser = async (url: string) =>
  await (window as any).electronAPI.openBrowser(url);

const saveElectronState = async (state: any) => {
  const encryptedState = await (window as any).electronAPI.encrypt(
    JSON.stringify(state)
  );
  await (window as any).electronAPI.saveState(encryptedState);
};

export { isElectron, openBrowser, saveElectronState };
