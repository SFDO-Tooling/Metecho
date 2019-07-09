import { AppState } from '@/store';
import { User } from '@/store/user/reducer';

export const selectUserState = (appState: AppState): User | null =>
  appState.user;
