import { createSelector } from 'reselect';

import { AppState } from '@/js/store';

export const selectIssuesState = (appState: AppState) => appState.issues;

export const selectIssues = createSelector(
  selectIssuesState,
  (state) => state.issues,
);

const selectIssueId = (appState: AppState, id: string) => id;

export const selectIssueNotFound = createSelector(
  [selectIssuesState, selectIssueId],
  (state, id) => Boolean(id && state.notFound.includes(id)),
);

export const selectIssue = createSelector(
  [selectIssues, selectIssueId, selectIssueNotFound],
  (issues, id, notFound) => {
    /* istanbul ignore if */
    if (!id) {
      return undefined;
    }
    const issue = issues.find((i) => i.id === id);
    if (issue) {
      return issue;
    }
    return notFound ? null : undefined;
  },
);
