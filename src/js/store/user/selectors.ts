import { AppState } from '_js/store';
import { User } from '_js/store/user/reducer';

export const selectUserState = (appState: AppState): User | null =>
  appState.user;
