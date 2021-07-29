import { AppState } from '@/js/store';
import { ToastType } from '@/js/store/toasts/reducer';

export const selectToasts = (appState: AppState): ToastType[] =>
  appState.toasts;
