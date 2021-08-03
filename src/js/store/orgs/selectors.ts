import { createSelector } from 'reselect';

import { AppState } from '@/js/store';
import { selectEpic } from '@/js/store/epics/selectors';
import { Org, OrgState } from '@/js/store/orgs/reducer';
import { selectProject } from '@/js/store/projects/selectors';
import { selectTask } from '@/js/store/tasks/selectors';
import { ORG_TYPES } from '@/js/utils/constants';

export const selectOrgState = (appState: AppState): OrgState => appState.orgs;

export const selectOrgsByTask = createSelector(
  [selectOrgState, selectTask],
  (orgs, task): Org[] | undefined => {
    /* istanbul ignore else */
    if (task && orgs.fetched.tasks.includes(task.id)) {
      return Object.values(orgs.orgs).filter((org) => org?.task === task.id);
    }
    return undefined;
  },
);

export const selectPlaygroundOrgsByEpic = createSelector(
  [selectOrgState, selectEpic],
  (orgs, epic): Org[] | undefined => {
    /* istanbul ignore else */
    if (epic && orgs.fetched.epics.includes(epic.id)) {
      return Object.values(orgs.orgs).filter(
        (org) =>
          org?.epic === epic.id && org?.org_type === ORG_TYPES.PLAYGROUND,
      );
    }
    return undefined;
  },
);

export const selectPlaygroundOrgsByProject = createSelector(
  [selectOrgState, selectProject],
  (orgs, project): Org[] | undefined => {
    /* istanbul ignore else */
    if (project && orgs.fetched.projects.includes(project.id)) {
      return Object.values(orgs.orgs).filter(
        (org) =>
          org?.project === project.id && org?.org_type === ORG_TYPES.PLAYGROUND,
      );
    }
    return undefined;
  },
);
