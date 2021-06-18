import { AppState } from '~js/store';
import { selectUserState } from '~js/store/user/selectors';

export const isCurrentUser = (id: string | null, state: AppState) => {
  const user = selectUserState(state);
  return Boolean(id && user?.id === id);
};

export const hasViewedStep = (id: string, state: AppState) => {
  const user = selectUserState(state);
  return Boolean(user?.self_guided_tour_state?.includes(id));
};
