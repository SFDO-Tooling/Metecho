import { AppState } from '@/js/store';
import { ErrorType } from '@/js/store/errors/reducer';

export const selectErrors = (appState: AppState): ErrorType[] =>
  appState.errors;
