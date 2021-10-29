import { AppState } from '@/js/store';

export const selectSocketState = (appState: AppState) => appState.socket;
