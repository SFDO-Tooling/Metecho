import { AppState } from '@/store';
import { Socket } from '@/store/socket/reducer';

export const selectSocketState = (appState: AppState): Socket =>
  appState.socket;
