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
    // Omit `text` here: the browser's native share sheet concatenates
    // title/text/url with no separator when the user chooses "Copy".
    await Share.share({
      title: appName
        ? `Join the${partyName ? ` ${partyName}` : ''} racing team on ${appName}!`
        : undefined,
      url,
      dialogTitle: 'Share invite',
    }).catch((e) => console.warn(e));
  }
};

export { canShareUrl, shareOrCopyUrl };
