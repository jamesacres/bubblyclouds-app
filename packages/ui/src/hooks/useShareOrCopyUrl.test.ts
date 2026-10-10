import { renderHook } from '@testing-library/react';
import { useShareOrCopyUrl } from './useShareOrCopyUrl';
import { shareOrCopyUrl } from '../helpers/share';

jest.mock('../helpers/share', () => ({
  shareOrCopyUrl: jest.fn().mockResolvedValue(undefined),
}));

describe('useShareOrCopyUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds a named team title', async () => {
    const { result } = renderHook(() => useShareOrCopyUrl());
    await result.current({
      url: 'https://x.test',
      appName: 'Race',
      partyName: 'Foxes',
    });
    expect(shareOrCopyUrl).toHaveBeenCalledWith({
      url: 'https://x.test',
      title: 'Join the Foxes racing team on Race!',
      dialogTitle: 'Share invite',
    });
  });

  it('builds an unnamed team title', async () => {
    const { result } = renderHook(() => useShareOrCopyUrl());
    await result.current({ url: 'https://x.test', appName: 'Race' });
    expect(shareOrCopyUrl).toHaveBeenCalledWith({
      url: 'https://x.test',
      title: 'Join the racing team on Race!',
      dialogTitle: 'Share invite',
    });
  });

  it('omits the title without an app name', async () => {
    const { result } = renderHook(() => useShareOrCopyUrl());
    await result.current({ url: 'https://x.test', appName: '' });
    expect(shareOrCopyUrl).toHaveBeenCalledWith({
      url: 'https://x.test',
      title: undefined,
      dialogTitle: 'Share invite',
    });
  });
});
