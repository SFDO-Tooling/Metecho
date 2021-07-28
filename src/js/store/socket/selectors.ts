import { AppState } from '@/js/store';
import { Socket } from '@/js/store/socket/reducer';

export const selectSocketState = (appState: AppState): Socket =>
  appState.socket;
