import { describe, it, expect, beforeEach } from '@jest/globals';
import { isElectron, openBrowser, saveElectronState } from './electron';

describe('electron helpers', () => {
  let mockElectronAPI: any;

  beforeEach(() => {
    // Clear previous mock
    delete (global.window as any).electronAPI;

    mockElectronAPI = {
      openBrowser: jest.fn(),
      encrypt: jest.fn(),
      saveState: jest.fn(),
    };
  });

  describe('isElectron', () => {
    it('should return true when electronAPI exists', () => {
      (global.window as any).electronAPI = mockElectronAPI;

      expect(isElectron()).toBe(true);
    });

    it('should return false when electronAPI does not exist', () => {
      expect(isElectron()).toBe(false);
    });

    it('should return false when window is undefined', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      expect(isElectron()).toBe(false);

      (global as any).window = originalWindow;
    });

    it('should handle empty electronAPI object', () => {
      (global.window as any).electronAPI = {};

      expect(isElectron()).toBe(true); // Just checks property existence
    });
  });

  describe('openBrowser', () => {
    beforeEach(() => {
      (global.window as any).electronAPI = mockElectronAPI;
    });

    it('should call electronAPI.openBrowser with URL', async () => {
      mockElectronAPI.openBrowser.mockResolvedValue(undefined);

      await openBrowser('https://example.com');

      expect(mockElectronAPI.openBrowser).toHaveBeenCalledWith(
        'https://example.com'
      );
    });

    it('should handle different URLs', async () => {
      mockElectronAPI.openBrowser.mockResolvedValue(undefined);

      const urls = [
        'https://google.com',
        'https://github.com/anthropics/claude-code',
        'file:///path/to/file',
      ];

      for (const url of urls) {
        await openBrowser(url);
        expect(mockElectronAPI.openBrowser).toHaveBeenCalledWith(url);
      }
    });

    it('should handle promise rejection', async () => {
      mockElectronAPI.openBrowser.mockRejectedValue(
        new Error('Browser not available')
      );

      await expect(openBrowser('https://example.com')).rejects.toThrow(
        'Browser not available'
      );
    });

    it('should handle empty URL', async () => {
      mockElectronAPI.openBrowser.mockResolvedValue(undefined);

      await openBrowser('');

      expect(mockElectronAPI.openBrowser).toHaveBeenCalledWith('');
    });

    it('should return the promise from electronAPI', async () => {
      const mockReturn = { success: true };
      mockElectronAPI.openBrowser.mockResolvedValue(mockReturn);

      const result = await openBrowser('https://example.com');

      expect(result).toEqual(mockReturn);
    });
  });

  describe('saveElectronState', () => {
    beforeEach(() => {
      (global.window as any).electronAPI = mockElectronAPI;
    });

    it('should serialize, encrypt, and save state', async () => {
      const testState = { counter: 5, name: 'test' };
      const encryptedValue = 'encrypted_content_here';

      mockElectronAPI.encrypt.mockResolvedValue(encryptedValue);
      mockElectronAPI.saveState.mockResolvedValue(undefined);

      await saveElectronState(testState);

      expect(mockElectronAPI.encrypt).toHaveBeenCalledWith(
        JSON.stringify(testState)
      );
      expect(mockElectronAPI.saveState).toHaveBeenCalledWith(encryptedValue);
    });

    it('should handle empty state object', async () => {
      mockElectronAPI.encrypt.mockResolvedValue('empty_encrypted');
      mockElectronAPI.saveState.mockResolvedValue(undefined);

      await saveElectronState({});

      expect(mockElectronAPI.encrypt).toHaveBeenCalledWith('{}');
    });

    it('should handle complex nested state', async () => {
      const complexState = {
        user: { id: 1, name: 'Test User' },
        sessions: [{ id: 1, time: 100 }],
        settings: { theme: 'dark', lang: 'en' },
      };

      mockElectronAPI.encrypt.mockResolvedValue('complex_encrypted');
      mockElectronAPI.saveState.mockResolvedValue(undefined);

      await saveElectronState(complexState);

      expect(mockElectronAPI.encrypt).toHaveBeenCalledWith(
        JSON.stringify(complexState)
      );
      expect(mockElectronAPI.saveState).toHaveBeenCalled();
    });

    it('should handle encryption failure', async () => {
      mockElectronAPI.encrypt.mockRejectedValue(new Error('Encryption failed'));

      await expect(saveElectronState({ test: 'data' })).rejects.toThrow(
        'Encryption failed'
      );

      expect(mockElectronAPI.saveState).not.toHaveBeenCalled();
    });

    it('should handle save failure', async () => {
      mockElectronAPI.encrypt.mockResolvedValue('encrypted_data');
      mockElectronAPI.saveState.mockRejectedValue(new Error('Save failed'));

      await expect(saveElectronState({ test: 'data' })).rejects.toThrow(
        'Save failed'
      );
    });

    it('should call methods in correct order', async () => {
      const callOrder: string[] = [];

      mockElectronAPI.encrypt.mockImplementation(async () => {
        callOrder.push('encrypt');
        return 'encrypted';
      });

      mockElectronAPI.saveState.mockImplementation(async () => {
        callOrder.push('saveState');
      });

      await saveElectronState({ test: 'data' });

      expect(callOrder).toEqual(['encrypt', 'saveState']);
    });

    it('should serialize all data types correctly', async () => {
      const stateWithTypes = {
        string: 'text',
        number: 42,
        boolean: true,
        null: null,
        array: [1, 2, 3],
        object: { nested: 'value' },
        date: new Date('2024-01-01').toISOString(),
      };

      mockElectronAPI.encrypt.mockResolvedValue('encrypted');
      mockElectronAPI.saveState.mockResolvedValue(undefined);

      await saveElectronState(stateWithTypes);

      const expectedJson = JSON.stringify(stateWithTypes);
      expect(mockElectronAPI.encrypt).toHaveBeenCalledWith(expectedJson);
    });
  });

  describe('integration scenarios', () => {
    beforeEach(() => {
      (global.window as any).electronAPI = mockElectronAPI;
    });

    it('should handle complete workflow', async () => {
      const state = { userId: '123', sessionId: 'abc' };
      const encryptedData = 'encrypted_content';

      mockElectronAPI.encrypt.mockResolvedValue(encryptedData);
      mockElectronAPI.saveState.mockResolvedValue(undefined);
      mockElectronAPI.openBrowser.mockResolvedValue(undefined);

      // Save state
      await saveElectronState(state);
      expect(mockElectronAPI.encrypt).toHaveBeenCalled();
      expect(mockElectronAPI.saveState).toHaveBeenCalledWith(encryptedData);

      // Open browser
      await openBrowser('https://example.com');
      expect(mockElectronAPI.openBrowser).toHaveBeenCalledWith(
        'https://example.com'
      );
    });

    it('should check electron and perform operations', async () => {
      expect(isElectron()).toBe(true);

      mockElectronAPI.encrypt.mockResolvedValue('enc');
      mockElectronAPI.saveState.mockResolvedValue(undefined);

      await saveElectronState({ test: 'data' });

      expect(mockElectronAPI.encrypt).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should throw when electronAPI not available for openBrowser', async () => {
      delete (global.window as any).electronAPI;

      await expect(openBrowser('https://example.com')).rejects.toThrow();
    });

    it('should throw when electronAPI not available for saveElectronState', async () => {
      delete (global.window as any).electronAPI;

      await expect(saveElectronState({ test: 'data' })).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      (global.window as any).electronAPI = mockElectronAPI;
    });

    it('should handle very large state object', async () => {
      const largeState: any = {};
      for (let i = 0; i < 1000; i++) {
        largeState[`key_${i}`] = `value_${i}`;
      }

      mockElectronAPI.encrypt.mockResolvedValue('encrypted_large');
      mockElectronAPI.saveState.mockResolvedValue(undefined);

      await saveElectronState(largeState);

      expect(mockElectronAPI.encrypt).toHaveBeenCalled();
    });

    it('should handle state with circular references (will throw)', async () => {
      const state: any = { a: 1 };
      state.self = state; // Circular reference

      mockElectronAPI.encrypt.mockResolvedValue('encrypted');

      // JSON.stringify throws on circular references
      await expect(saveElectronState(state)).rejects.toThrow();
    });

    it('should handle URLs with special characters', async () => {
      mockElectronAPI.openBrowser.mockResolvedValue(undefined);

      const specialUrl = 'https://example.com?param=value&other=123#section';

      await openBrowser(specialUrl);

      expect(mockElectronAPI.openBrowser).toHaveBeenCalledWith(specialUrl);
    });
  });
});
