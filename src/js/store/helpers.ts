import { AppState } from '~js/store';
import { selectUserState } from '~js/store/user/selectors';

export const isCurrentUser = (id: string | null, state: AppState) => {
  const user = selectUserState(state);
  return Boolean(id && user?.id === id);
};

// @@@ rough sketch of helper function for checking if popover id is in self_guided_tour_state array
/* export const hasViewedStep = (id: string | null, state: AppState) => {
  const user = selectUserState(state);

  if (id is in self_guided_tour_state)
  return
  else { id.push into self_guided_tour_state}
} */
// @@@
