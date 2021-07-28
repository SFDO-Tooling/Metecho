import { AppState } from '_js/store';
import { selectUserState } from '_js/store/user/selectors';

export const isCurrentUser = (id: string | null, state: AppState) => {
  const user = selectUserState(state);
  return Boolean(id && user?.id === id);
};
