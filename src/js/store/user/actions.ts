import { ThunkResult } from '@/store';
import { fetchObjects } from '@/store/actions';
import { User } from '@/store/user/reducer';
import apiFetch from '@/utils/api';
import { OBJECT_TYPES } from '@/utils/constants';

interface LoginAction {
  type: 'USER_LOGGED_IN';
  payload: User;
}
export interface LogoutAction {
  type: 'USER_LOGGED_OUT';
}
interface RefecthDataAction {
  type:
    | 'REFETCH_DATA_STARTED'
    | 'REFETCH_DATA_SUCCEEDED'
    | 'REFETCH_DATA_FAILED';
}
export type UserAction = LoginAction | LogoutAction | RefecthDataAction;

export const login = (payload: User): LoginAction => {
  if (window.Sentry) {
    window.Sentry.setUser(payload);
  }
  /* istanbul ignore else */
  if (payload && window.socket) {
    window.socket.subscribe({
      model: 'user',
      id: payload.id,
    });
  }
  return {
    type: 'USER_LOGGED_IN',
    payload,
  };
};

export const logout = (): ThunkResult => dispatch =>
  apiFetch(window.api_urls.account_logout(), dispatch, {
    method: 'POST',
  }).then(() => {
    /* istanbul ignore else */
    if (window.socket) {
      window.socket.reconnect();
    }
    if (window.Sentry) {
      window.Sentry.configureScope(scope => scope.clear());
    }
    return dispatch({ type: 'USER_LOGGED_OUT' });
  });

export const refetchAllData = (): ThunkResult => async dispatch => {
  dispatch({ type: 'REFETCH_DATA_STARTED' });
  try {
    const payload = await apiFetch(window.api_urls.user(), dispatch, {}, [
      401,
      403,
      404,
    ]);
    dispatch({ type: 'REFETCH_DATA_SUCCEEDED' });
    if (!payload) {
      return dispatch({ type: 'USER_LOGGED_OUT' });
    }
    dispatch(login(payload));
    return dispatch(
      fetchObjects({ objectType: OBJECT_TYPES.PRODUCT, reset: true }),
    );
  } catch (err) {
    dispatch({ type: 'REFETCH_DATA_FAILED' });
    throw err;
  }
};
