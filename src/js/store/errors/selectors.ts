import { AppState } from '@/store';
import { ErrorType } from '@/store/errors/reducer';

export const selectErrors = (appState: AppState): ErrorType[] =>
  appState.errors;
