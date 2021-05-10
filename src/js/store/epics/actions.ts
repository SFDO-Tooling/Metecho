import i18n from 'i18next';

import { ThunkResult } from '~js/store';
import { Epic } from '~js/store/epics/reducer';
import { isCurrentUser } from '~js/store/helpers';
import { addToast } from '~js/store/toasts/actions';

interface EpicUpdated {
  type: 'EPIC_UPDATE';
  payload: Epic;
}
interface EpicCreatePRFailed {
  type: 'EPIC_CREATE_PR_FAILED';
  payload: Epic;
}

export type EpicAction = EpicUpdated | EpicCreatePRFailed;

export const updateEpic = (payload: Epic): EpicUpdated => ({
  type: 'EPIC_UPDATE',
  payload,
});

export const createEpicPR =
  ({
    model,
    originating_user_id,
  }: {
    model: Epic;
    originating_user_id: string | null;
  }): ThunkResult<EpicUpdated> =>
  (dispatch, getState) => {
    /* istanbul ignore else */
    if (isCurrentUser(originating_user_id, getState())) {
      dispatch(
        addToast({
          heading: i18n.t(
            'Successfully submitted epic for review on GitHub: “{{epic_name}}”.',
            { epic_name: model.name },
          ),
          linkText: model.pr_url ? i18n.t('View pull request.') : undefined,
          linkUrl: model.pr_url ? model.pr_url : undefined,
          openLinkInNewWindow: true,
        }),
      );
    }

    return dispatch({
      type: 'EPIC_UPDATE' as const,
      payload: model,
    });
  };

export const createEpicPRFailed =
  ({
    model,
    message,
    originating_user_id,
  }: {
    model: Epic;
    message?: string;
    originating_user_id: string | null;
  }): ThunkResult<EpicCreatePRFailed> =>
  (dispatch, getState) => {
    /* istanbul ignore else */
    if (isCurrentUser(originating_user_id, getState())) {
      dispatch(
        addToast({
          heading: i18n.t(
            'Uh oh. There was an error submitting epic for review on GitHub: “{{epic_name}}”.',
            { epic_name: model.name },
          ),
          details: message,
          variant: 'error',
        }),
      );
    }
    return dispatch({
      type: 'EPIC_CREATE_PR_FAILED' as const,
      payload: model,
    });
  };
