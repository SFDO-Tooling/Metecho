import { ThunkResult } from '@/js/store';
import {
  projectsRefreshed,
  projectsRefreshing,
} from '@/js/store/projects/actions';
import { User } from '@/js/store/user/reducer';
import apiFetch from '@/js/utils/api';
import { LIST_CHANNEL_ID, OBJECT_TYPES } from '@/js/utils/constants';

interface LoginAction {
  type: 'USER_LOGGED_IN';
  payload: User;
}
export interface LogoutAction {
  type: 'USER_LOGGED_OUT';
}
export interface RefetchDataAction {
  type:
    | 'REFETCH_DATA_STARTED'
    | 'REFETCH_DATA_SUCCEEDED'
    | 'REFETCH_DATA_FAILED';
}
interface DisconnectSucceeded {
  type: 'USER_DISCONNECT_SUCCEEDED';
  payload: User;
}
interface DisconnectAction {
  type: 'USER_DISCONNECT_REQUESTED' | 'USER_DISCONNECT_FAILED';
}
interface RefreshUserSucceeded {
  type: 'USER_REFRESH_SUCCEEDED';
  payload: User;
}
interface RefreshUserAction {
  type: 'USER_REFRESH_REQUESTED' | 'USER_REFRESH_FAILED';
}
interface AgreeToTermsAction {
  type: 'AGREE_TO_TERMS_REQUESTED' | 'AGREE_TO_TERMS_FAILED';
}
interface AgreeToTermsSucceeded {
  type: 'AGREE_TO_TERMS_SUCCEEDED';
  payload: User;
}
interface OnboardingAction {
  type: 'ONBOARDING_REQUESTED' | 'ONBOARDING_FAILED';
}
interface OnboardingSucceeded {
  type: 'ONBOARDING_SUCCEEDED';
  payload: User;
}
interface UpdateTourAction {
  type: 'TOUR_UPDATE_REQUESTED' | 'TOUR_UPDATE_FAILED';
}
interface UpdateTourSucceeded {
  type: 'TOUR_UPDATE_SUCCEEDED';
  payload: User;
}

export type UserAction =
  | LoginAction
  | LogoutAction
  | RefetchDataAction
  | DisconnectAction
  | DisconnectSucceeded
  | RefreshUserAction
  | RefreshUserSucceeded
  | AgreeToTermsAction
  | AgreeToTermsSucceeded
  | OnboardingAction
  | UpdateTourAction
  | UpdateTourSucceeded
  | OnboardingSucceeded;

export const login = (payload: User): LoginAction => {
  if (window.Sentry) {
    window.Sentry.setUser(payload);
  }
  /* istanbul ignore else */
  if (payload && window.socket) {
    window.socket.subscribe({
      model: OBJECT_TYPES.USER,
      id: payload.id,
    });
    window.socket.subscribe({
      model: OBJECT_TYPES.ORG,
      id: LIST_CHANNEL_ID,
    });
  }
  return {
    type: 'USER_LOGGED_IN',
    payload,
  };
};

export const logout = (): ThunkResult<Promise<LogoutAction>> => (dispatch) =>
  apiFetch({
    url: window.api_urls.account_logout(),
    dispatch,
    opts: {
      method: 'POST',
    },
  }).then(() => {
    /* istanbul ignore else */
    if (window.socket) {
      window.socket.reconnect();
    }
    if (window.Sentry) {
      window.Sentry.configureScope((scope) => scope.clear());
    }
    return dispatch({ type: 'USER_LOGGED_OUT' as const });
  });

export const refetchAllData =
  (): ThunkResult<Promise<RefetchDataAction | LogoutAction>> =>
  async (dispatch) => {
    dispatch({ type: 'REFETCH_DATA_STARTED' });
    try {
      const payload = await apiFetch({
        url: window.api_urls.current_user_detail(),
        dispatch,
        suppressErrorsOn: [401, 403, 404],
      });
      if (!payload) {
        return dispatch({ type: 'USER_LOGGED_OUT' as const });
      }
      dispatch(login(payload));
      dispatch(projectsRefreshing());
      dispatch(projectsRefreshed());
      return dispatch({
        type: 'REFETCH_DATA_SUCCEEDED' as const,
      });
    } catch (err) {
      dispatch({ type: 'REFETCH_DATA_FAILED' });
      throw err;
    }
  };

export const disconnect =
  (): ThunkResult<Promise<DisconnectSucceeded>> => async (dispatch) => {
    dispatch({ type: 'USER_DISCONNECT_REQUESTED' });
    try {
      const payload = await apiFetch({
        url: window.api_urls.current_user_disconnect(),
        dispatch,
        opts: {
          method: 'POST',
        },
      });
      return dispatch({
        type: 'USER_DISCONNECT_SUCCEEDED' as const,
        payload,
      });
    } catch (err) {
      dispatch({ type: 'USER_DISCONNECT_FAILED' });
      throw err;
    }
  };

export const refreshUser =
  (): ThunkResult<Promise<RefreshUserSucceeded>> => async (dispatch) => {
    dispatch({ type: 'USER_REFRESH_REQUESTED' });
    try {
      const payload = await apiFetch({
        url: window.api_urls.current_user_detail(),
        dispatch,
      });
      return dispatch({
        type: 'USER_REFRESH_SUCCEEDED' as const,
        payload,
      });
    } catch (err) {
      dispatch({ type: 'USER_REFRESH_FAILED' });
      throw err;
    }
  };

export const agreeToTerms =
  (): ThunkResult<Promise<AgreeToTermsSucceeded>> => async (dispatch) => {
    dispatch({ type: 'AGREE_TO_TERMS_REQUESTED' });
    try {
      const payload = await apiFetch({
        url: window.api_urls.current_user_agree_to_tos(),
        dispatch,
        opts: {
          method: 'PUT',
        },
      });
      return dispatch({
        type: 'AGREE_TO_TERMS_SUCCEEDED' as const,
        payload,
      });
    } catch (err) {
      dispatch({ type: 'AGREE_TO_TERMS_FAILED' });
      throw err;
    }
  };

export const onboarded =
  (): ThunkResult<Promise<OnboardingSucceeded>> => async (dispatch) => {
    dispatch({ type: 'ONBOARDING_REQUESTED' });
    try {
      const payload = await apiFetch({
        url: window.api_urls.current_user_complete_onboarding(),
        dispatch,
        opts: {
          method: 'PUT',
        },
      });
      return dispatch({
        type: 'ONBOARDING_SUCCEEDED' as const,
        payload,
      });
    } catch (err) {
      dispatch({ type: 'ONBOARDING_FAILED' });
      throw err;
    }
  };

export const updateTour =
  (data: {
    enabled?: boolean;
    state?: string[] | null;
  }): ThunkResult<Promise<UpdateTourSucceeded>> =>
  async (dispatch) => {
    dispatch({ type: 'TOUR_UPDATE_REQUESTED' });
    try {
      const payload: User = await apiFetch({
        url: window.api_urls.current_user_guided_tour(),
        dispatch,
        opts: {
          method: 'POST',
          body: JSON.stringify(data),
          headers: {
            'Content-Type': 'application/json',
          },
        },
      });
      return dispatch({
        type: 'TOUR_UPDATE_SUCCEEDED' as const,
        payload,
      });
    } catch (err) {
      dispatch({ type: 'TOUR_UPDATE_FAILED' });
      throw err;
    }
  };
