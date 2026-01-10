import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock InAppReview before importing anything
jest.mock('@capacitor-community/in-app-review', () => ({
  InAppReview: {
    requestReview: jest.fn(() => Promise.resolve()),
  },
}));

// Mock Capacitor
jest.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: jest.fn(),
  },
  registerPlugin: jest.fn(),
}));

import {
  isCapacitor,
  isIOS,
  isAndroid,
  saveCapacitorState,
  getCapacitorState,
  CapacitorSecureStorage,
} from './capacitor';

// Mock SecureStoragePlugin
jest.mock('capacitor-secure-storage-plugin', () => ({
  SecureStoragePlugin: {
    set: jest.fn(),
    get: jest.fn(),
  },
}));

import { Capacitor } from '@capacitor/core';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';

describe('capacitor helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isCapacitor', () => {
    it('should return true for android platform', () => {
      (Capacitor.getPlatform as any).mockReturnValue('android');
      expect(isCapacitor()).toBe(true);
    });

    it('should return true for ios platform', () => {
      (Capacitor.getPlatform as any).mockReturnValue('ios');
      expect(isCapacitor()).toBe(true);
    });

    it('should return false for web platform', () => {
      (Capacitor.getPlatform as any).mockReturnValue('web');
      expect(isCapacitor()).toBe(false);
    });

    it('should return false for unknown platform', () => {
      (Capacitor.getPlatform as any).mockReturnValue('unknown');
      expect(isCapacitor()).toBe(false);
    });
  });

  describe('isIOS', () => {
    it('should return true for ios platform', () => {
      (Capacitor.getPlatform as any).mockReturnValue('ios');
      expect(isIOS()).toBe(true);
    });

    it('should return false for android platform', () => {
      (Capacitor.getPlatform as any).mockReturnValue('android');
      expect(isIOS()).toBe(false);
    });

    it('should return false for web platform', () => {
      (Capacitor.getPlatform as any).mockReturnValue('web');
      expect(isIOS()).toBe(false);
    });
  });

  describe('isAndroid', () => {
    it('should return true for android platform', () => {
      (Capacitor.getPlatform as any).mockReturnValue('android');
      expect(isAndroid()).toBe(true);
    });

    it('should return false for ios platform', () => {
      (Capacitor.getPlatform as any).mockReturnValue('ios');
      expect(isAndroid()).toBe(false);
    });

    it('should return false for web platform', () => {
      (Capacitor.getPlatform as any).mockReturnValue('web');
      expect(isAndroid()).toBe(false);
    });
  });

  describe('saveCapacitorState', () => {
    it('should serialize and save state', async () => {
      const testState = { counter: 5, name: 'test' };

      await saveCapacitorState(testState);

      expect(SecureStoragePlugin.set).toHaveBeenCalledWith({
        key: CapacitorSecureStorage.STATE,
        value: JSON.stringify(testState),
      });
    });

    it('should handle empty state', async () => {
      await saveCapacitorState({});

      expect(SecureStoragePlugin.set).toHaveBeenCalledWith({
        key: CapacitorSecureStorage.STATE,
        value: '{}',
      });
    });

    it('should handle complex nested state', async () => {
      const complexState = {
        user: { id: 1, name: 'Test' },
        data: [1, 2, 3],
        nested: { deep: { value: 'test' } },
      };

      await saveCapacitorState(complexState);

      expect(SecureStoragePlugin.set).toHaveBeenCalledWith({
        key: CapacitorSecureStorage.STATE,
        value: JSON.stringify(complexState),
      });
    });
  });

  describe('getCapacitorState', () => {
    it('should retrieve and return state', async () => {
      const testState = { counter: 5, name: 'test' };
      (SecureStoragePlugin.get as any).mockResolvedValue({
        value: JSON.stringify(testState),
      });

      const result = await getCapacitorState();

      expect(result).toBe(JSON.stringify(testState));
      expect(SecureStoragePlugin.get).toHaveBeenCalledWith({
        key: CapacitorSecureStorage.STATE,
      });
    });

    it('should handle empty state', async () => {
      (SecureStoragePlugin.get as any).mockResolvedValue({
        value: '{}',
      });

      const result = await getCapacitorState();

      expect(result).toBe('{}');
    });

    it('should handle promise rejection', async () => {
      (SecureStoragePlugin.get as any).mockRejectedValue(
        new Error('Storage error')
      );

      await expect(getCapacitorState()).rejects.toThrow('Storage error');
    });
  });

  describe('CapacitorSecureStorage enum', () => {
    it('should have STATE key', () => {
      expect(CapacitorSecureStorage.STATE).toBe('STATE');
    });
  });

  describe('integration scenarios', () => {
    it('should save and retrieve state successfully', async () => {
      const testState = { session: 'test123', timestamp: Date.now() };

      // Save
      await saveCapacitorState(testState);

      // Mock return value for retrieval
      (SecureStoragePlugin.get as any).mockResolvedValue({
        value: JSON.stringify(testState),
      });

      // Retrieve
      const result = await getCapacitorState();

      expect(result).toBe(JSON.stringify(testState));
    });

    it('should handle platform detection correctly', () => {
      (Capacitor.getPlatform as any).mockReturnValue('android');
      expect(isCapacitor()).toBe(true);
      expect(isAndroid()).toBe(true);
      expect(isIOS()).toBe(false);

      (Capacitor.getPlatform as any).mockReturnValue('ios');
      expect(isCapacitor()).toBe(true);
      expect(isAndroid()).toBe(false);
      expect(isIOS()).toBe(true);

      (Capacitor.getPlatform as any).mockReturnValue('web');
      expect(isCapacitor()).toBe(false);
      expect(isAndroid()).toBe(false);
      expect(isIOS()).toBe(false);
    });
  });
});
