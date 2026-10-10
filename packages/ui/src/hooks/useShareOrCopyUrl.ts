import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { shareOrCopyUrl } from '../helpers/share';

const useShareOrCopyUrl = () => {
  const { t } = useTranslation('ui');

  return useCallback(
    ({
      url,
      appName,
      partyName,
    }: {
      url: string;
      appName: string;
      partyName?: string;
    }): Promise<void> => {
      let title: string | undefined;
      if (appName) {
        title = partyName
          ? t('share.joinNamedTeam', { partyName, appName })
          : t('share.joinTeam', { appName });
      }
      return shareOrCopyUrl({
        url,
        title,
        dialogTitle: t('share.dialogTitle'),
      });
    },
    [t]
  );
};

export { useShareOrCopyUrl };
