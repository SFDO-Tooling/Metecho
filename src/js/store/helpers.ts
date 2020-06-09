import { AppState } from '@/store';
import { selectUserState } from '@/store/user/selectors';

export const isCurrentUser = (id: string | null, state: AppState) => {
  const user = selectUserState(state);
  return Boolean(id && user?.id === id);
};
