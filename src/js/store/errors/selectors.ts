import { AppState } from '_js/store';
import { ErrorType } from '_js/store/errors/reducer';

export const selectErrors = (appState: AppState): ErrorType[] =>
  appState.errors;
