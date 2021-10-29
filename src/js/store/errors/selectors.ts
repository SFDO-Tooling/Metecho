import { AppState } from '@/js/store';

export const selectErrors = (appState: AppState) => appState.errors;
