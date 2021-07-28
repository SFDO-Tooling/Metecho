import { AppState } from '_js/store';
import { Socket } from '_js/store/socket/reducer';

export const selectSocketState = (appState: AppState): Socket =>
  appState.socket;
