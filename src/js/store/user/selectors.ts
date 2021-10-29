import { AppState } from '@/js/store';

export const selectUserState = (appState: AppState) => appState.user;
