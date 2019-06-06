// @flow

import type { ThunkAction } from 'redux-thunk';

import type { User } from 'store/user/reducer';

type LoginAction = { type: 'USER_LOGGED_IN', payload: User };
type LogoutAction = { type: 'USER_LOGGED_OUT' };
export type UserAction = LoginAction | LogoutAction;

export const login = (payload: User): LoginAction => {
  if (window.Raven && window.Raven.isSetup()) {
    window.Raven.setUserContext(payload);
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

export const logout = (): ThunkAction => (dispatch, getState, { apiFetch }) =>
  apiFetch(window.api_urls.account_logout(), {
    method: 'POST',
  }).then(() => {
    /* istanbul ignore else */
    if (window.socket) {
      window.socket.reconnect();
    }
    if (window.Raven && window.Raven.isSetup()) {
      window.Raven.setUserContext();
    }
    return dispatch({ type: 'USER_LOGGED_OUT' });
  });

export const refetchAllData = (): ThunkAction => (
  dispatch,
  getState,
  { apiFetch },
) => {
  dispatch({ type: 'REFETCH_DATA_STARTED' });
  return apiFetch(window.api_urls.user())
    .then(payload => {
      dispatch({ type: 'REFETCH_DATA_SUCCEEDED' });
      dispatch({ type: 'USER_LOGGED_OUT' });
      if (!payload) {
        return null;
      }
      return dispatch(login(payload));
    })
    .catch(err => {
      dispatch({ type: 'REFETCH_DATA_FAILED' });
      throw err;
    });
};
