import { BaseServerState } from '@bubblyclouds-app/template/types/state';
import { ProfileData } from './profile';
import { MonthlySnapshotData } from './snapshot';

// Framework envelope (empty scaffolding for template compat); real payload
// lives in `data`.
export interface MoneyBagsMonthState extends BaseServerState<unknown> {
  data: MonthlySnapshotData;
}

export interface MoneyBagsProfileState extends BaseServerState<unknown> {
  data: ProfileData;
}
