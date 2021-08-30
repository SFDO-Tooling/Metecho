import { AppState } from '@/js/store';
import { User } from '@/js/store/user/reducer';

export const selectUserState = (appState: AppState): User | null =>
  appState.user;
