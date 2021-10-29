import { AppState } from '@/js/store';

export const selectToasts = (appState: AppState) => appState.toasts;
