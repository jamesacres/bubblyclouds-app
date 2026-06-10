import { Share } from '@capacitor/share';

const canShareUrl = (): Promise<boolean> =>
  Share.canShare()
    .then(({ value }) => value)
    .catch((e) => {
      console.warn(e);
      return false;
    });

const shareOrCopyUrl = async ({
  url,
  appName,
  partyName,
}: {
  url: string;
  appName: string;
  partyName?: string;
}): Promise<void> => {
  await navigator.clipboard
    .writeText(url)
    .catch((e) => console.warn('Failed to copy:', e));

  if (await canShareUrl()) {
    await Share.share({
      title: `You're invited to a ${appName}!`,
      text: `Join the${partyName ? ` ${partyName}` : ''} racing team`,
      url,
      dialogTitle: 'Share invite',
    }).catch((e) => console.warn(e));
  }
};

export { canShareUrl, shareOrCopyUrl };
