import auth from '@bubblyclouds-app/auth/locales/en';
import games from '@bubblyclouds-app/games/locales/en';
import unblockrace from '@bubblyclouds-app/unblockrace/locales/en';
import template from '@bubblyclouds-app/template/locales/en';
import ui from '@bubblyclouds-app/ui/locales/en';
import app from './locales/en.json';

export const DEFAULT_LOCALE = 'en';

export const supportedLocales = ['en'];

export const resources = {
  en: { ui, auth, template, games, unblockrace, app },
};
