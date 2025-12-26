import { ServerStateResult } from './serverTypes';

export interface UserSession<T = unknown> {
  isLoading: boolean;
  sessions?: ServerStateResult<T>[];
}

export interface UserSessions<T = unknown> {
  [userId: string]: UserSession<T> | undefined;
}
