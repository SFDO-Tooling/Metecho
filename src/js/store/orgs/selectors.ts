import { createSelector } from 'reselect';

import { AppState } from '@/store';
import { OrgState } from '@/store/orgs/reducer';
import { selectTask } from '@/store/tasks/selectors';

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
