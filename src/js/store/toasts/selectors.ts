import { AppState } from '_js/store';
import { ToastType } from '_js/store/toasts/reducer';

export const selectToasts = (appState: AppState): ToastType[] =>
  appState.toasts;
