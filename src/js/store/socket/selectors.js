// @flow

import type { AppState } from 'store';
import type { Socket } from 'store/socket/reducer';

export const selectSocketState = (appState: AppState): Socket =>
  appState.socket;
