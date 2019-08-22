import { AppState } from '@/store';
import { ToastType } from '@/store/toasts/reducer';

export const selectToasts = (appState: AppState): ToastType[] =>
  appState.toasts;
