import { BaseServerState } from '@bubblyclouds-app/template/types/state';

export interface MoneyBagsState extends BaseServerState<unknown> {
  data: Record<string, unknown>;
}
