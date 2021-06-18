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

export const handleOpenPopover = (id: string, state: AppState) => {
  const user = selectUserState(state);

  if (user?.self_guided_tour_state?.includes(id)) {
    return user.self_guided_tour_state;
  } else if (user?.self_guided_tour_state?.length) {
    user.self_guided_tour_state.push(id);
  }
  return user?.self_guided_tour_state;
};
