import { createSelector } from 'reselect';

import { AppState } from '~js/store';
import { OrgState } from '~js/store/orgs/reducer';
import { selectTask } from '~js/store/tasks/selectors';

export const selectOrgState = (appState: AppState): OrgState => appState.orgs;

export const selectOrgsByTask = createSelector(
  [selectOrgState, selectTask],
  (orgs, task) => {
    /* istanbul ignore else */
    if (task) {
      return orgs[task.id];
    }
    return undefined;
  },
);
